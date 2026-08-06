import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, planId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log(`Creating payment session for user: ${userId}`);

    // 🚀 FUTURE REAL CODE AESA HOGA:
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{ price: planId, quantity: 1 }],
    //   mode: 'subscription',
    //   success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=success`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/pricing`,
    //   client_reference_id: userId,
    // });
    // return NextResponse.json({ url: session.url });

    // 🛠️ CURRENT TEST MODE: 
    // Abhi API keys nahi hain, toh hum direct simulate kar rahe hain
    const fakeCheckoutUrl = `/dashboard?payment=success&user_id=${userId}`;

    return NextResponse.json({ url: fakeCheckoutUrl });

  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}