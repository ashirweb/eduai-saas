import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const eventType = body.type || "payment.success";
    const userId = body.userId; 

    if (eventType === "payment.success" && userId) {
      console.log(`Payment confirmed! Upgrading user ${userId} to PRO...`);

      // 🔥 FIX 1: Pehle check karo aur Profile bana do (Purane users ka masla hal karne ke liye)
      await supabase
        .from("profiles")
        .upsert({ id: userId }, { onConflict: 'id' });

      // 🔥 FIX 2: Phir Subscription ko upsert karo
      const { error } = await supabase
        .from("subscriptions")
        .upsert({ 
          user_id: userId,
          status: 'active',
          plan_name: 'EduAI Pro',
          subscription_start: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error("Database Update Error:", error);
        // Ab exact error frontend par bhejenge taake pata chale asli masla kya tha
        return NextResponse.json({ error: `DB Error: ${error.message}` }, { status: 500 });
      }

      return NextResponse.json({ message: "User upgraded successfully" }, { status: 200 });
    }

    return NextResponse.json({ message: "Event ignored" }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Failed" }, { status: 400 });
  }
}