import { NextRequest, NextResponse } from "next/server";
import { createTenant, updateTenantStatus, generateSecrets } from "@/lib/tenants";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { businessName, whatsappNumber, paymentProvider } = await req.json();

    if (!businessName || !whatsappNumber || !paymentProvider) {
      return NextResponse.json(
        { error: "businessName, whatsappNumber, and paymentProvider are required" },
        { status: 400 }
      );
    }

    // 1. Create tenant record in central DB
    const tenant = await createTenant(businessName, whatsappNumber, paymentProvider);
    const secrets = generateSecrets();

    // 2. Call Coolify API to deploy a new bot instance
    const coolifyUrl = process.env.COOLIFY_API_URL;
    const coolifyToken = process.env.COOLIFY_API_TOKEN;

    if (!coolifyUrl || !coolifyToken) {
      // Dev mode: skip Coolify, just mark as awaiting_config
      await updateTenantStatus(tenant.id, "awaiting_config");
      return NextResponse.json({
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        status: "awaiting_config",
        webhookUrl: `https://${tenant.subdomain}/api/webhook`,
        webhookVerifyToken: tenant.webhook_verify_token,
      });
    }

    // Production: Create service in Coolify
    const envVars = {
      BUSINESS_NAME: businessName,
      OLLAMA_BASE_URL: "http://ollama:11434",
      NEXT_PUBLIC_APP_URL: `https://${tenant.subdomain}`,
      WHATSAPP_PHONE_NUMBER_ID: "PLACEHOLDER",
      WHATSAPP_ACCESS_TOKEN: "PLACEHOLDER",
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: tenant.webhook_verify_token,
      PAYMENT_PROVIDER: paymentProvider,
      CRON_SECRET: secrets.cronSecret,
      ADMIN_PASSWORD: secrets.adminPassword,
      ADVOCATE_API_KEY: secrets.advocateApiKey,
      PAYMENTS_API_KEY: secrets.paymentsApiKey,
      NEXT_PUBLIC_SUPABASE_URL: "WILL_BE_SET",
      SUPABASE_SERVICE_ROLE_KEY: "WILL_BE_SET",
    };

    try {
      const coolifyRes = await fetch(`${coolifyUrl}/services`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${coolifyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `moolabiz-${tenant.id.slice(0, 8)}`,
          project_uuid: process.env.COOLIFY_PROJECT_UUID,
          type: "docker-compose",
          domains: [tenant.subdomain],
          environment_variables: envVars,
        }),
      });

      const coolifyData = await coolifyRes.json();

      await updateTenantStatus(tenant.id, "awaiting_config", {
        coolify_service_id: coolifyData.uuid ?? coolifyData.id ?? null,
      });
    } catch (coolifyErr) {
      console.error("[provision] Coolify error:", coolifyErr);
      await updateTenantStatus(tenant.id, "awaiting_config");
    }

    return NextResponse.json({
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      status: "awaiting_config",
      webhookUrl: `https://${tenant.subdomain}/api/webhook`,
      webhookVerifyToken: tenant.webhook_verify_token,
    });
  } catch (err) {
    console.error("[provision] Error:", err);
    const msg = err instanceof Error ? err.message : "Provisioning failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
