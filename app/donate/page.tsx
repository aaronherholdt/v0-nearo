import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function DonatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/forum">
            <Button variant="ghost" className="text-gray-600 hover:text-emerald-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Keep Nearo Alive - Together
          </h1>

          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <p className="text-xl font-semibold text-emerald-600">
              A note from the founder:
            </p>

            <p>
              When I started building Nearo, I had one simple belief:{" "}
              <strong>no homeschooling family should feel isolated.</strong>
            </p>

            <p>
              I've watched parents in Facebook groups, scattered across forums,
              desperately searching for "other families like us" in their city.
              I've seen the loneliness that comes from choosing a different path
              for your children. And I knew there had to be a better way.
            </p>

            <p className="text-xl font-semibold text-gray-900">
              Nearo exists because community shouldn't have a price tag.
            </p>

            <p>
              Every family here, whether you can donate or not, has full access
              to everything. Always. That's a promise. Because the single mom
              working two jobs deserves to find her tribe just as much as anyone
              else. Because the family that just spent everything on a
              cross-country move to find freedom needs connection, not another
              subscription.
            </p>

            <p className="text-xl font-semibold text-gray-900">
              But here's the reality:
            </p>

            <p>
              Running Nearo costs money. Servers, databases, keeping messages
              flowing, maps loading, forums alive. Right now, I'm covering these
              costs alone, and as our community grows, so do the expenses.
            </p>

            <p className="text-xl font-semibold text-emerald-600">
              Here's where you come in:
            </p>

            <p>
              If Nearo has helped you find even one family you connected with...
              if it's made you feel less alone... if you believe more families
              deserve to discover this community... would you consider chipping
              in?
            </p>

            <p>
              Even <strong>$5 a month</strong> from a handful of families could
              make a real dent in our costs. <strong>$10</strong> could keep the
              lights on for a couple days. <strong>$20</strong> could cover our IDE
              costs for a month. Every single contribution, no matter how small,
              keeps Nearo free for everyone.
            </p>

            <p className="text-xl font-semibold text-gray-900">
              This isn't about me. This is about keeping this space alive for:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                The family moving to Costa Rica next month, scared and excited
              </li>
              <li>
                The single dad who just pulled his kids from school and doesn't
                know where to start
              </li>
              <li>
                The parents in your city who don't know you exist yet, but need
                to
              </li>
            </ul>

            <p>
              You're not just donating to a platform.{" "}
              <strong>
                You're keeping doors open for families who need what you found
                here.
              </strong>
            </p>

            <p>
              If you can't give right now? No worries. Seriously. Your presence
              here matters. Share Nearo with other families. That's contribution
              enough.
            </p>

            <p>
              But if you can spare the cost of a coffee or two each month? You'll
              be directly responsible for keeping this community alive and
              accessible for everyone.
            </p>

            <p className="text-lg italic">
              Thank you for being here. Thank you for believing in real
              connection over corporate platforms. And thank you for considering
              keeping Nearo free, forever.
            </p>

            <p className="text-right font-semibold text-gray-900">
              With gratitude,
              <br />
              Aaron
            </p>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm font-semibold text-gray-600 mb-4">
                P.S. Want to see exactly where your donation goes? Here's the
                breakdown:
              </p>

              <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-100">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Monthly Running Costs:
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span>Database (Supabase):</span>
                    <span className="font-medium">$60/month</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Server (Vercel):</span>
                    <span className="font-medium">Free/month</span>
                  </li>
                  <li className="flex justify-between">
                    <span>IDE (Cursor):</span>
                    <span className="font-medium">$20/month</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Email service:</span>
                    <span className="font-medium">$14/year</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Domain name:</span>
                    <span className="font-medium">$5/year</span>
                  </li>
                  <li className="flex justify-between border-t border-emerald-200 pt-2 mt-2 font-bold">
                    <span>Total:</span>
                    <span className="text-emerald-700">~$80/month</span>
                  </li>
                </ul>
                <p className="text-xs text-gray-600 mt-4 italic">
                  That's it. No salaries. No fancy offices. Just keeping the
                  servers running so families can connect.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Support Nearo
            </h2>

            <div className="flex flex-col items-center gap-4">
              {/* PayPal Donation Button */}
              <form
                action="https://www.paypal.com/donate"
                method="post"
                target="_blank"
                className="inline-block"
              >
                <input type="hidden" name="hosted_button_id" value="TC3MGFF8TLH8S" />
                <input type="hidden" name="return" value="https://nearo.forum/donate/thank-you" />
                <button
                  type="submit"
                  className="bg-[#0070ba] hover:bg-[#003087] text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Donate with PayPal
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center max-w-md">
                You'll be redirected to PayPal to complete your donation
                securely. You don't need a PayPal account to donate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
