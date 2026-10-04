import type { ReactNode } from 'react'
import { useSettings } from '../lib/settings'
import { AYANAMSA_LABEL, DEFAULT_SETTINGS, type Preferences } from '../vedic/settings'

type Option<K extends keyof Preferences> = { value: Preferences[K]; label: string; note: string }

function Choice<K extends keyof Preferences>({ k, title, intro, options }: { k: K; title: string; intro: ReactNode; options: Option<K>[] }) {
  const { settings, update } = useSettings()
  return (
    <fieldset className="card setting">
      <legend><h2>{title}</h2></legend>
      <p className="muted small">{intro}</p>
      {options.map((o) => (
        <label key={String(o.value)} className={`setting-option ${settings[k] === o.value ? 'active' : ''}`}>
          <input type="radio" name={k} checked={settings[k] === o.value} onChange={() => update({ [k]: o.value } as Partial<Preferences>)} />
          <span><strong>{o.label}</strong><span className="muted small">{o.note}</span></span>
        </label>
      ))}
    </fieldset>
  )
}

export default function SettingsPage() {
  const { settings, update } = useSettings()
  return (
    <div className="settings-page">
      <header className="page-head">
        <p className="eyebrow">Settings</p>
        <h1>Calculation settings</h1>
        <p className="lede">These settings apply to every chart, report and Panchang on this device. Shared chart links carry only birth details, so each person sees the chart with their own settings.</p>
      </header>
      <div className="settings-grid">
        <Choice k="ayanamsa" title="Ayanamsa" intro="The offset between the tropical and sidereal zodiacs. Lahiri is the Indian government standard and the most widely used." options={[
          { value: 'lahiri', label: AYANAMSA_LABEL.lahiri, note: 'Indian Calendar Reform Committee standard (1956). Default.' },
          { value: 'true-chitra', label: AYANAMSA_LABEL['true-chitra'], note: 'Keeps the star Spica (Chitra) at exactly 0° Libra. Within a few arc-minutes of Lahiri.' },
          { value: 'kp', label: AYANAMSA_LABEL.kp, note: 'Used in the Krishnamurti Paddhati system. About 6′ less than Lahiri.' },
          { value: 'raman', label: AYANAMSA_LABEL.raman, note: 'Used in B. V. Raman\'s books. About 1°27′ less than Lahiri.' },
        ]} />
        <Choice k="node" title="Rahu and Ketu" intro="Most Indian software uses the mean node. The true node includes the Moon's short-term wobble and can differ by up to about 1.5°." options={[
          { value: 'mean', label: 'Mean node', note: 'Smooth average motion. Default.' },
          { value: 'true', label: 'True node', note: 'Osculating node of the Moon\'s actual orbit.' },
        ]} />
        <Choice k="karakas" title="Chara karakas" intro="Jaimini's variable significators, ranked by degree within sign. They are used for the Atmakaraka, Amatyakaraka, Darakaraka and Putrakaraka." options={[
          { value: 7, label: 'Seven karakas', note: 'Sun to Saturn. The scheme used by most Jaimini authors.' },
          { value: 8, label: 'Eight karakas', note: 'Adds Rahu (degree counted backwards) and Pitrikaraka, as in Parashara.' },
        ]} />
        <Choice k="chartStyle" title="Chart style" intro="How square charts are drawn." options={[
          { value: 'north', label: 'North Indian', note: 'Houses fixed, signs shown by number. The 1st house is at the top.' },
          { value: 'south', label: 'South Indian', note: 'Signs fixed, Pisces in the top-left corner. The lagna is marked.' },
        ]} />
        <Choice k="gender" title="Reports for" intro="Classical marriage and children rules differ by gender (for example, Jupiter as karaka of the husband)." options={[
          { value: 'unspecified', label: 'Not specified', note: 'Shared rules only.' },
          { value: 'male', label: 'Man', note: 'Adds rules classical texts give for a man.' },
          { value: 'female', label: 'Woman', note: 'Adds rules classical texts give for a woman.' },
        ]} />
        <Choice k="system" title="Default system" intro="Which chart opens first. You can switch on the chart page at any time." options={[
          { value: 'vedic', label: 'Vedic (sidereal)', note: 'Kundali, divisional charts, dashas and reports.' },
          { value: 'western', label: 'Western (tropical)', note: 'Chart wheel with aspects.' },
        ]} />
      </div>
      <p className="center section-gap"><button className="btn ghost" onClick={() => update({ ...DEFAULT_SETTINGS, place: settings.place })}>Restore defaults</button></p>
    </div>
  )
}
