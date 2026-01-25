"use client"

import { useState, useRef } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, Settings, Plus } from "lucide-react"

type Props = { existingProfile?: any }

const INTERESTS = ["hiking","beach","board-games","museum","camping","sports","coding","arts & crafts"]
const LOOKING_FOR = ["playdates","co-op","nature-meetups","travel-buddies","study-group"]
const LANGUAGES = ["English","Spanish","Portuguese","French","German","Thai"]
const INCLUSION = ["autism-friendly","sensory-friendly","allergy-aware","wheelchair-accessible"]

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm border transition cursor-pointer
        ${selected ? "bg-emerald-50 border-emerald-600 text-emerald-700"
                   : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
    >
      {label}
    </button>
  )
}

export default function AdvancedProfileForm({ existingProfile }: Props) {
  const supabase = createClientComponentClient()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const mp = existingProfile?.match_prefs ?? {}

  const [interests, setInterests] = useState<string[]>(mp.interests ?? [])
  const [customInterest, setCustomInterest] = useState<string>("")
  const [lookingFor, setLookingFor] = useState<string[]>(mp.looking_for ?? [])
  const [customLookingFor, setCustomLookingFor] = useState<string>("")
  const [languages, setLanguages] = useState<string[]>(mp.languages ?? [])
  const [customLanguage, setCustomLanguage] = useState<string>("")
  const [inclusion, setInclusion] = useState<string[]>(mp.inclusion_tags ?? [])
  const [customInclusion, setCustomInclusion] = useState<string>("")
  // Families ring (keep using match_view)
  const [matchMinKm, setMatchMinKm] = useState<number>(mp.match_view?.min_km ?? 0)
  const [matchMaxKm, setMatchMaxKm] = useState<number>(mp.match_view?.max_km ?? 50)

  // NEW: Meetups ring
  const [meetMinKm, setMeetMinKm] = useState<number>(mp.meetups_view?.min_km ?? 0)
  const [meetMaxKm, setMeetMaxKm] = useState<number>(mp.meetups_view?.max_km ?? 80)

  // NEW: Trips ring
  const [tripMinKm, setTripMinKm] = useState<number>(mp.trips_view?.min_km ?? 0)
  const [tripMaxKm, setTripMaxKm] = useState<number>(mp.trips_view?.max_km ?? 200)
  const [showAdvancedPublicly, setShowAdvancedPublicly] = useState<boolean>(
    mp.visibility?.show_advanced ?? true
  )

  const toggle = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value])
  }

  // VALIDATION helper (clamp + ensure min ≤ max)
  function clampPair(min: number, max: number, hardMax = 1000) {
    const m = Math.max(0, Math.min(min, hardMax))
    const M = Math.max(m, Math.min(max, hardMax))
    return [m, M] as const
  }
  
  const addCustomValue = (value: string, list: string[], setter: (v: string[]) => void, customSetter: (v: string) => void) => {
    if (value.trim()) {
      setter([...list, value.trim()])
      customSetter("")
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Please sign in.")

      const match_prefs = {
        interests,
        looking_for: lookingFor,
        languages,
        inclusion_tags: inclusion,

        // REMOVE travel block entirely

        match_view: {                      // families
          min_km: Number(matchMinKm) || 0,
          max_km: Number(matchMaxKm) || null,
        },
        meetups_view: {                    // NEW
          min_km: Number(meetMinKm) || 0,
          max_km: Number(meetMaxKm) || null,
        },
        trips_view: {                      // NEW
          min_km: Number(tripMinKm) || 0,
          max_km: Number(tripMaxKm) || null,
        },

        visibility: { ...(mp.visibility ?? {}), show_advanced: showAdvancedPublicly },
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, match_prefs, updated_at: new Date().toISOString() }, { onConflict: "id" })

      if (error) throw new Error(error.message)
      setMessage("Advanced settings saved.")
    } catch (e: any) {
      setMessage(e?.message || "Could not save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Settings className="h-6 w-6 text-emerald-600 mr-2" />
          </div>
          <CardTitle>Advanced Profile</CardTitle>
          <CardDescription>Optional click-to-select preferences to help families connect</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interests */}
          <section>
            <Label className="text-sm">Interests</Label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INTERESTS.map(opt => (
                <Chip key={opt} label={opt} selected={interests.includes(opt)} onClick={() => toggle(opt, interests, setInterests)} />
              ))}
              <Chip key="other-interest" label="Other" selected={customInterest.length > 0} onClick={() => customInterest.length === 0 ? setCustomInterest(" ") : setCustomInterest("")} />
            </div>
            {customInterest.length > 0 || interests.some(i => !INTERESTS.includes(i)) ? (
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Add custom interest"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  size="sm"
                  onClick={() => addCustomValue(customInterest, interests, setInterests, setCustomInterest)}
                  disabled={!customInterest.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            {interests.filter(i => !INTERESTS.includes(i)).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {interests.filter(i => !INTERESTS.includes(i)).map(custom => (
                  <span key={custom} className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    {custom}
                    <button 
                      type="button" 
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-200 hover:text-emerald-600"
                      onClick={() => setInterests(interests.filter(i => i !== custom))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Looking for */}
          <section>
            <Label className="text-sm">Looking for</Label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LOOKING_FOR.map(opt => (
                <Chip key={opt} label={opt} selected={lookingFor.includes(opt)} onClick={() => toggle(opt, lookingFor, setLookingFor)} />
              ))}
              <Chip key="other-looking-for" label="Other" selected={customLookingFor.length > 0} onClick={() => customLookingFor.length === 0 ? setCustomLookingFor(" ") : setCustomLookingFor("")} />
            </div>
            {customLookingFor.length > 0 || lookingFor.some(i => !LOOKING_FOR.includes(i)) ? (
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Add custom option"
                  value={customLookingFor}
                  onChange={(e) => setCustomLookingFor(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  size="sm"
                  onClick={() => addCustomValue(customLookingFor, lookingFor, setLookingFor, setCustomLookingFor)}
                  disabled={!customLookingFor.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            {lookingFor.filter(i => !LOOKING_FOR.includes(i)).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {lookingFor.filter(i => !LOOKING_FOR.includes(i)).map(custom => (
                  <span key={custom} className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    {custom}
                    <button 
                      type="button" 
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-200 hover:text-emerald-600"
                      onClick={() => setLookingFor(lookingFor.filter(i => i !== custom))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Languages */}
          <section>
            <Label className="text-sm">Languages</Label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LANGUAGES.map(opt => (
                <Chip key={opt} label={opt} selected={languages.includes(opt)} onClick={() => toggle(opt, languages, setLanguages)} />
              ))}
              <Chip key="other-language" label="Other" selected={customLanguage.length > 0} onClick={() => customLanguage.length === 0 ? setCustomLanguage(" ") : setCustomLanguage("")} />
            </div>
            {customLanguage.length > 0 || languages.some(i => !LANGUAGES.includes(i)) ? (
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Add custom language"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  size="sm"
                  onClick={() => addCustomValue(customLanguage, languages, setLanguages, setCustomLanguage)}
                  disabled={!customLanguage.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            {languages.filter(i => !LANGUAGES.includes(i)).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {languages.filter(i => !LANGUAGES.includes(i)).map(custom => (
                  <span key={custom} className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    {custom}
                    <button 
                      type="button" 
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-200 hover:text-emerald-600"
                      onClick={() => setLanguages(languages.filter(i => i !== custom))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Inclusion */}
          <section>
            <Label className="text-sm">Inclusion</Label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INCLUSION.map(opt => (
                <Chip key={opt} label={opt} selected={inclusion.includes(opt)} onClick={() => toggle(opt, inclusion, setInclusion)} />
              ))}
              <Chip key="other-inclusion" label="Other" selected={customInclusion.length > 0} onClick={() => customInclusion.length === 0 ? setCustomInclusion(" ") : setCustomInclusion("")} />
            </div>
            {customInclusion.length > 0 || inclusion.some(i => !INCLUSION.includes(i)) ? (
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Add custom inclusion tag"
                  value={customInclusion}
                  onChange={(e) => setCustomInclusion(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  size="sm"
                  onClick={() => addCustomValue(customInclusion, inclusion, setInclusion, setCustomInclusion)}
                  disabled={!customInclusion.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
            {inclusion.filter(i => !INCLUSION.includes(i)).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {inclusion.filter(i => !INCLUSION.includes(i)).map(custom => (
                  <span key={custom} className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    {custom}
                    <button 
                      type="button" 
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-emerald-400 hover:bg-emerald-200 hover:text-emerald-600"
                      onClick={() => setInclusion(inclusion.filter(i => i !== custom))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Families radius (existing) */}
          <section className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Show families at least (km)</Label>
              <Input type="number" min={0} max={1000} value={matchMinKm}
                onChange={(e)=>{ const [m,M]=clampPair(Number(e.target.value), matchMaxKm); setMatchMinKm(m); setMatchMaxKm(M)}}
                className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">Optional: hide super-close matches under this distance.</p>
            </div>
            <div>
              <Label className="text-sm">Show families up to (km)</Label>
              <Input type="number" min={1} max={1000} value={matchMaxKm}
                onChange={(e)=>{ const [m,M]=clampPair(matchMinKm, Number(e.target.value)); setMatchMinKm(m); setMatchMaxKm(M)}}
                className="mt-2" />
            </div>
          </section>

          {/* NEW: Meetups radius */}
          <section className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Show meetups at least (km)</Label>
              <Input type="number" min={0} max={1000} value={meetMinKm}
                onChange={(e)=>{ const [m,M]=clampPair(Number(e.target.value), meetMaxKm); setMeetMinKm(m); setMeetMaxKm(M)}}
                className="mt-2" />
            </div>
            <div>
              <Label className="text-sm">Show meetups up to (km)</Label>
              <Input type="number" min={1} max={1000} value={meetMaxKm}
                onChange={(e)=>{ const [m,M]=clampPair(meetMinKm, Number(e.target.value)); setMeetMinKm(m); setMeetMaxKm(M)}}
                className="mt-2" />
            </div>
          </section>

          {/* NEW: Trips radius */}
          <section className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Show trips at least (km)</Label>
              <Input type="number" min={0} max={2000} value={tripMinKm}
                onChange={(e)=>{ const [m,M]=clampPair(Number(e.target.value), tripMaxKm, 5000); setTripMinKm(m); setTripMaxKm(M)}}
                className="mt-2" />
            </div>
            <div>
              <Label className="text-sm">Show trips up to (km)</Label>
              <Input type="number" min={1} max={5000} value={tripMaxKm}
                onChange={(e)=>{ const [m,M]=clampPair(tripMinKm, Number(e.target.value), 5000); setTripMinKm(m); setTripMaxKm(M)}}
                className="mt-2" />
            </div>
          </section>

          {/* Visibility */}
          <section>
            <Label className="text-sm">Visibility</Label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <Checkbox checked={showAdvancedPublicly} onCheckedChange={(v)=>setShowAdvancedPublicly(!!v)} />
              Show Advanced section on our public profile
            </label>
          </section>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Advanced Settings"}
          </Button>

          {message && (
            <div className={`text-sm px-4 py-3 rounded border
                ${message.includes("saved") ? "bg-green-50 border-green-200 text-green-700"
                                            : "bg-red-50 border-red-200 text-red-700"}`}>
              {message}
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            All fields are optional. You can change these any time.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
