import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  email: string;
  type: "welcome" | "upgrade" | "downgrade" | "cancelled" | "renewed";
  planName: string;
  userName?: string;
}

const getEmailContent = (type: string, planName: string, userName?: string) => {
  const name = userName || "Valued Customer";
  
  switch (type) {
    case "welcome":
      return {
        subject: `Welcome to Bath AI ${planName}!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0;">Bath AI</h1>
              <p style="color: #64748b; margin-top: 5px;">AI Studio</p>
            </div>
            <h2 style="color: #1e293b;">Welcome to Bath AI, ${name}! 🎉</h2>
            <p style="color: #475569; line-height: 1.6;">
              Thank you for subscribing to <strong>${planName}</strong>! We're thrilled to have you on board.
            </p>
            <p style="color: #475569; line-height: 1.6;">
              You now have access to all the amazing AI tools including:
            </p>
            <ul style="color: #475569; line-height: 1.8;">
              <li>Neural Video Dubbing</li>
              <li>Voice Cloning</li>
              <li>AI Image & Video Generation</li>
              <li>Document AI Analysis</li>
              <li>And much more!</li>
            </ul>
            <div style="margin-top: 30px; text-align: center;">
              <a href="https://bathai.app" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Start Creating
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 40px; text-align: center;">
              © 2024 Bath AI. All rights reserved.
            </p>
          </div>
        `,
      };
    
    case "upgrade":
      return {
        subject: `You've upgraded to ${planName}! 🚀`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0;">Bath AI</h1>
            </div>
            <h2 style="color: #1e293b;">Congratulations on your upgrade, ${name}! 🚀</h2>
            <p style="color: #475569; line-height: 1.6;">
              You've successfully upgraded to <strong>${planName}</strong>. Your new features are now active!
            </p>
            <p style="color: #475569; line-height: 1.6;">
              Enjoy your enhanced AI capabilities and priority support.
            </p>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 40px; text-align: center;">
              © 2024 Bath AI. All rights reserved.
            </p>
          </div>
        `,
      };
    
    case "downgrade":
      return {
        subject: `Your plan has been changed to ${planName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0;">Bath AI</h1>
            </div>
            <h2 style="color: #1e293b;">Plan Updated</h2>
            <p style="color: #475569; line-height: 1.6;">
              Hi ${name}, your subscription has been changed to <strong>${planName}</strong>.
            </p>
            <p style="color: #475569; line-height: 1.6;">
              If this wasn't intentional or you have any questions, please contact our support team.
            </p>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 40px; text-align: center;">
              © 2024 Bath AI. All rights reserved.
            </p>
          </div>
        `,
      };
    
    case "cancelled":
      return {
        subject: "We're sorry to see you go",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0;">Bath AI</h1>
            </div>
            <h2 style="color: #1e293b;">Subscription Cancelled</h2>
            <p style="color: #475569; line-height: 1.6;">
              Hi ${name}, we're sorry to see you go. Your ${planName} subscription has been cancelled.
            </p>
            <p style="color: #475569; line-height: 1.6;">
              Your access will remain active until the end of your billing period. You can resubscribe anytime!
            </p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="https://bathai.app" style="background: #6366f1; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Resubscribe
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 40px; text-align: center;">
              © 2024 Bath AI. All rights reserved.
            </p>
          </div>
        `,
      };
    
    case "renewed":
      return {
        subject: `Your ${planName} subscription has been renewed`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0;">Bath AI</h1>
            </div>
            <h2 style="color: #1e293b;">Subscription Renewed ✓</h2>
            <p style="color: #475569; line-height: 1.6;">
              Hi ${name}, your <strong>${planName}</strong> subscription has been successfully renewed.
            </p>
            <p style="color: #475569; line-height: 1.6;">
              Thank you for continuing to use Bath AI. Keep creating amazing things!
            </p>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 40px; text-align: center;">
              © 2024 Bath AI. All rights reserved.
            </p>
          </div>
        `,
      };
    
    default:
      return {
        subject: "Bath AI Subscription Update",
        html: `<p>Your subscription status has been updated.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-subscription-email");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, planName, userName }: SubscriptionEmailRequest = await req.json();
    
    console.log(`Sending ${type} email to ${email} for plan ${planName}`);
    
    if (!email || !type || !planName) {
      throw new Error("Missing required fields: email, type, or planName");
    }

    const { subject, html } = getEmailContent(type, planName, userName);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bath AI <onboarding@resend.dev>",
        to: [email],
        subject,
        html,
      }),
    });

    const emailResponse = await res.json();
    
    if (!res.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending subscription email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
