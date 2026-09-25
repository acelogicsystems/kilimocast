import React, { useState, useEffect } from "react";
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Smartphone,
  Languages,
  RefreshCw,
  Sprout,
  ShieldAlert,
  Volume2,
  Share2,
  CalendarDays,
  Send
} from "lucide-react";

const LOCATIONS = [
  { name: "Embu (Runyenjes)", lat: -0.42, lon: 37.55 },
  { name: "Eldoret (Uasin Gishu)", lat: 0.5143, lon: 35.2698 },
  { name: "Kitale (Trans Nzoia)", lat: 1.0167, lon: 35.0 },
  { name: "Nyeri (Kieni)", lat: -0.4246, lon: 36.9517 },
  { name: "Meru (Imenti)", lat: 0.0463, lon: 37.6559 },
  { name: "Nakuru (Rongai)", lat: -0.3031, lon: 36.08 },
  { name: "Machakos (Yatta)", lat: -1.5177, lon: 37.2634 },
  { name: "Kisumu (Muhoroni)", lat: -0.0917, lon: 34.768 }
];

const CROPS = [
  { id: "maize", nameEn: "Maize (Mahindi)", nameSw: "Mahindi" },
  { id: "tomatoes", nameEn: "Tomatoes (Nyanya)", nameSw: "Nyanya" },
  { id: "potatoes", nameEn: "Potatoes (Warun)", nameSw: "Viazi Mviringo" },
  { id: "beans", nameEn: "Beans (Maharagwe)", nameSw: "Maharagwe" },
  { id: "coffee", nameEn: "Coffee (Kahawa)", nameSw: "Kahawa" }
];

export default function App() {
  const [lang, setLang] = useState("sw");
  const [selectedLoc, setSelectedLoc] = useState(LOCATIONS[0]);
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0].id);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [showUssdModal, setShowUssdModal] = useState(false);
  const [ussdStep, setUssdStep] = useState(1);
  const [copiedAlert, setCopiedAlert] = useState(false);

  const fetchWeather = async (lat, lon) => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max,temperature_2m_max,temperature_2m_min&hourly=relative_humidity_2m&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=Africa%2FNairobi`;
      const res = await fetch(url);
      const data = await res.json();
      setWeatherData(data);
    } catch (err) {
      console.error("Failed to fetch weather data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedLoc.lat, selectedLoc.lon);
  }, [selectedLoc]);

  // Derived current metrics
  const rain24h = weatherData?.daily?.precipitation_sum?.[0] ?? 0;
  const rainProb = weatherData?.daily?.precipitation_probability_max?.[0] ?? 0;
  const windSpeed = weatherData?.daily?.wind_speed_10m_max?.[0] ?? 0;
  const maxTemp = weatherData?.daily?.temperature_2m_max?.[0] ?? 24;
  const humidity = weatherData?.current?.relative_humidity_2m ?? 65;

  // 7-day daily forecast parsing
  const dailyDates = weatherData?.daily?.time || [];
  const dailyRains = weatherData?.daily?.precipitation_sum || [];
  const dailyWinds = weatherData?.daily?.wind_speed_10m_max || [];
  const dailyTemps = weatherData?.daily?.temperature_2m_max || [];

  // Rules Evaluation
  const evaluateDecisions = () => {
    let spray = {
      status: "SAFE",
      color: "border-emerald-500 bg-emerald-950/40 text-emerald-400",
      icon: CheckCircle2,
      msgEn: "Calm winds and low rain risk. Optimal window for pesticide & fungicide spraying.",
      msgSw: "Mvua ndogo na upepo tulivu. Wakati bora wa kupuliza dawa za magonjwa na wadudu."
    };
    if (rain24h > 5 || rainProb > 60 || windSpeed > 18) {
      spray = {
        status: "DANGER",
        color: "border-red-500 bg-red-950/40 text-red-400",
        icon: XCircle,
        msgEn: `High wash-off/drift risk (${rain24h}mm rain, ${windSpeed}km/h wind). Do not spray today.`,
        msgSw: `Hatari ya dawa kuoshwa au kupeperushwa (${rain24h}mm mvua, ${windSpeed}km/h upepo). Usipulize leo.`
      };
    }

    let fert = {
      status: "OPTIMAL",
      color: "border-emerald-500 bg-emerald-950/40 text-emerald-400",
      icon: CheckCircle2,
      msgEn: "Gentle moisture expected. Ideal condition for nutrient dissolution without runoff.",
      msgSw: "Mvua ya wastani inatarajiwa. Udongo utayeyusha mbolea vizuri bila kusombwa na maji."
    };
    if (rain24h > 25) {
      fert = {
        status: "DANGER",
        color: "border-red-500 bg-red-950/40 text-red-400",
        icon: XCircle,
        msgEn: `Heavy torrential rain expected (${rain24h}mm). High fertilizer leaching risk. Postpone.`,
        msgSw: `Mvua kubwa mno inatarajiwa (${rain24h}mm). Hatari ya mbolea kusombwa au kupotea ardhini.`
      };
    } else if (rain24h < 2 && rainProb < 25) {
      fert = {
        status: "CAUTION",
        color: "border-amber-500 bg-amber-950/40 text-amber-400",
        icon: AlertTriangle,
        msgEn: "Soil is excessively dry. Applying fertilizer without moisture causes leaf scorch.",
        msgSw: "Udongo ni mkavu mno. Mbolea bila maji itachoma mizizi na majani."
      };
    }

    let blight = {
      status: "LOW",
      color: "border-emerald-500 bg-emerald-950/40 text-emerald-400",
      icon: CheckCircle2,
      msgEn: "Dry conditions. Low fungal spore germination pressure.",
      msgSw: "Hali kavu. Hatari ndogo ya ukungu au magonjwa ya majani."
    };
    if (humidity > 78 && maxTemp > 19) {
      blight = {
        status: "HIGH",
        color: "border-red-500 bg-red-950/40 text-red-400",
        icon: ShieldAlert,
        msgEn: `High blight & mold risk (Humidity: ${humidity}%). Inspect underside of leaves immediately.`,
        msgSw: `Hatari kubwa ya baridi yabisi na ukungu (Unyevu: ${humidity}%). Kagua majani mara moja.`
      };
    }

    return { spray, fert, blight };
  };

  const decisions = evaluateDecisions();

  // Voice Guidance
  const handleSpeak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // WhatsApp Alert Forwarder
  const shareWhatsAppAlert = () => {
    const cropObj = CROPS.find((c) => c.id === selectedCrop);
    const cropName = lang === "sw" ? cropObj?.nameSw : cropObj?.nameEn;
    const text = lang === "sw"
      ? `🌱 *TAARIFA YA KILIMOCAST* (${selectedLoc.name})\nZao: *${cropName}*\n\n🌦️ Hali: Mvua ${rain24h}mm, Upepo ${windSpeed}km/h\n🚫 Upuliziaji Dawa: ${decisions.spray.status === "SAFE" ? "RUHUSA KUPULIZA ✅" : "USIPULIZE LEO 🛑"}\n💧 Mbolea: ${decisions.fert.status === "OPTIMAL" ? "WEKA MBOLEA ✅" : "SUBIRI UNYEVU ⚠️"}\n\nPata ushauri bila bando piga *384*25#`
      : `🌱 *KILIMOCAST FARM ADVISORY* (${selectedLoc.name})\nCrop: *${cropName}*\n\n🌦️ Weather: Rain ${rain24h}mm, Wind ${windSpeed}km/h\n🚫 Pesticide Spraying: ${decisions.spray.status === "SAFE" ? "SAFE TO SPRAY ✅" : "DO NOT SPRAY 🛑"}\n💧 Fertilizer Top-Dress: ${decisions.fert.status === "OPTIMAL" ? "OPTIMAL WINDOW ✅" : "POSTPONE / TOO DRY ⚠️"}\n\nUSSD Fallback: dial *384*25#`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8">
      {/* Top Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-900/30">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              KilimoCast <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Kenya</span>
            </h1>
            <p className="text-xs text-slate-400">Hyper-Local Farming Advisory</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setUssdStep(1); setShowUssdModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>USSD *384#</span>
          </button>

          <button
            onClick={() => setLang(lang === "sw" ? "en" : "sw")}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-lg text-white transition"
          >
            <Languages className="w-4 h-4" />
            <span>{lang === "sw" ? "EN" : "KISW"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl space-y-6">
        {/* County & Crop Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
              {lang === "sw" ? "Chagua Eneo / Kaunti:" : "Select County / Ward:"}
            </label>
            <select
              value={selectedLoc.name}
              onChange={(e) => {
                const loc = LOCATIONS.find((l) => l.name === e.target.value);
                if (loc) setSelectedLoc(loc);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
              {lang === "sw" ? "Chagua Zao Lako:" : "Select Your Crop:"}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500"
            >
              {CROPS.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {lang === "sw" ? crop.nameSw : crop.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Weather Metrics Card */}
        <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {lang === "sw" ? "Hali ya Hewa Leo" : "Current 24h Metrics"}
                </span>
                {loading && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
              </div>
              <h2 className="text-2xl font-bold mt-1 text-white">{selectedLoc.name}</h2>
            </div>

            <div className="flex flex-wrap gap-2.5 text-xs font-medium">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
                <CloudRain className="w-4 h-4 text-sky-400" />
                <span>{rain24h} mm ({rainProb}%)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
                <Wind className="w-4 h-4 text-emerald-400" />
                <span>{windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
                <Droplets className="w-4 h-4 text-indigo-400" />
                <span>{humidity}% Humid</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>{maxTemp}°C Max</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Decision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Spraying */}
          <div className={`p-5 rounded-2xl border-2 transition-all shadow-lg flex flex-col justify-between ${decisions.spray.color}`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  {lang === "sw" ? "Upuliziaji Dawa" : "Spraying Pesticide"}
                </span>
                <decisions.spray.icon className="w-6 h-6" />
              </div>
              <div className="text-xl font-black mb-2">
                {decisions.spray.status === "SAFE" ? (lang === "sw" ? "RUHUSA KUPULIZA" : "SAFE TO SPRAY") : (lang === "sw" ? "USIPULIZE LEO" : "DO NOT SPRAY")}
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {lang === "sw" ? decisions.spray.msgSw : decisions.spray.msgEn}
              </p>
            </div>
            <button
              onClick={() => handleSpeak(lang === "sw" ? decisions.spray.msgSw : decisions.spray.msgEn)}
              className="mt-4 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-black/20 hover:bg-black/40 rounded-lg text-xs font-semibold transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>{lang === "sw" ? "Sikiliza Maelezo" : "Read Aloud"}</span>
            </button>
          </div>

          {/* Card 2: Fertilizer */}
          <div className={`p-5 rounded-2xl border-2 transition-all shadow-lg flex flex-col justify-between ${decisions.fert.color}`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  {lang === "sw" ? "Kuweka Mbolea" : "Fertilizer Top-Dress"}
                </span>
                <decisions.fert.icon className="w-6 h-6" />
              </div>
              <div className="text-xl font-black mb-2">
                {decisions.fert.status === "OPTIMAL" ? (lang === "sw" ? "WAKATI BORA" : "OPTIMAL WINDOW") : decisions.fert.status === "DANGER" ? (lang === "sw" ? "HATARI YA KUSOMBWA" : "HIGH LEACH RISK") : (lang === "sw" ? "UDONGO MKAVU" : "TOO DRY")}
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {lang === "sw" ? decisions.fert.msgSw : decisions.fert.msgEn}
              </p>
            </div>
            <button
              onClick={() => handleSpeak(lang === "sw" ? decisions.fert.msgSw : decisions.fert.msgEn)}
              className="mt-4 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-black/20 hover:bg-black/40 rounded-lg text-xs font-semibold transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>{lang === "sw" ? "Sikiliza Maelezo" : "Read Aloud"}</span>
            </button>
          </div>

          {/* Card 3: Disease Risk */}
          <div className={`p-5 rounded-2xl border-2 transition-all shadow-lg flex flex-col justify-between ${decisions.blight.color}`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  {lang === "sw" ? "Tahadhari ya Ukungu" : "Blight / Pest Pressure"}
                </span>
                <decisions.blight.icon className="w-6 h-6" />
              </div>
              <div className="text-xl font-black mb-2">
                {decisions.blight.status === "HIGH" ? (lang === "sw" ? "HATARI KUBWA" : "HIGH BLIGHT RISK") : (lang === "sw" ? "HATARI NDOGO" : "LOW PRESSURE")}
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {lang === "sw" ? decisions.blight.msgSw : decisions.blight.msgEn}
              </p>
            </div>
            <button
              onClick={() => handleSpeak(lang === "sw" ? decisions.blight.msgSw : decisions.blight.msgEn)}
              className="mt-4 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-black/20 hover:bg-black/40 rounded-lg text-xs font-semibold transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>{lang === "sw" ? "Sikiliza Maelezo" : "Read Aloud"}</span>
            </button>
          </div>
        </div>

        {/* 7-Day Planning Outlook Ribbon */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-200">
              {lang === "sw" ? "Mtazamo wa Siku 7 wa Upuliziaji Dawa" : "7-Day Spraying & Planting Outlook"}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {dailyDates.slice(0, 7).map((date, idx) => {
              const rain = dailyRains[idx] ?? 0;
              const wind = dailyWinds[idx] ?? 0;
              const temp = dailyTemps[idx] ?? 24;
              const dayName = new Date(date).toLocaleDateString(lang === "sw" ? "sw-KE" : "en-US", { weekday: "short" });
              const isSafe = rain <= 5 && wind <= 18;

              return (
                <div
                  key={date}
                  className={`p-3 rounded-xl border text-center flex flex-col justify-between ${
                    isSafe
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                      : "bg-red-950/20 border-red-500/30 text-red-300"
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{dayName}</span>
                  <div className="my-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${isSafe ? "bg-emerald-400 shadow-emerald-400/50" : "bg-red-400 shadow-red-400/50"} shadow-sm`}></span>
                  </div>
                  <div className="text-[10px] space-y-0.5 opacity-80">
                    <div>{rain}mm</div>
                    <div>{Math.round(temp)}°C</div>
                  </div>
                  <span className="text-[9px] font-semibold mt-1">
                    {isSafe ? (lang === "sw" ? "Salama" : "Safe") : (lang === "sw" ? "Mvua/Upepo" : "Avoid")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Community Extension & WhatsApp Dispatcher */}
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              {lang === "sw" ? "Sambaza Taarifa kwa Kikundi cha Wakulima" : "Broadcast Advisory to Farmer Groups"}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "sw"
                ? "Tuma ushauri huu moja kwa moja kwenye WhatsApp au SMS ya chama cha wakulima."
                : "Instantly dispatch formatted advisory to local cooperatives or extension officer groups."}
            </p>
          </div>
          <button
            onClick={shareWhatsAppAlert}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 transition"
          >
            <Send className="w-4 h-4" />
            <span>{copiedAlert ? (lang === "sw" ? "Imefunguliwa WhatsApp!" : "Opened WhatsApp!") : (lang === "sw" ? "Tuma WhatsApp" : "Share to WhatsApp")}</span>
          </button>
        </div>

        {/* Pitch Simulation Toggles */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-semibold">
            {lang === "sw" ? "Jaribu Hali Mbalimbali kwa Pitch:" : "Simulate Demo Scenarios for Pitch:"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setWeatherData({
                  daily: {
                    time: dailyDates,
                    precipitation_sum: [0, 0, 1, 0, 15, 0, 2],
                    precipitation_probability_max: [10],
                    wind_speed_10m_max: [8, 10, 12, 9, 22, 11, 8],
                    temperature_2m_max: [25, 26, 25, 24, 21, 23, 25]
                  },
                  current: { relative_humidity_2m: 55 }
                });
              }}
              className="px-3 py-1.5 bg-emerald-950 border border-emerald-700/50 hover:bg-emerald-900 text-emerald-300 rounded-lg transition"
            >
              ☀️ {lang === "sw" ? "Siku Kavu (Ruhusa)" : "Sunny / Spray Safe"}
            </button>
            <button
              onClick={() => {
                setWeatherData({
                  daily: {
                    time: dailyDates,
                    precipitation_sum: [32, 28, 19, 4, 0, 0, 1],
                    precipitation_probability_max: [90],
                    wind_speed_10m_max: [26, 22, 18, 10, 8, 9, 7],
                    temperature_2m_max: [21, 20, 22, 24, 25, 26, 25]
                  },
                  current: { relative_humidity_2m: 89 }
                });
              }}
              className="px-3 py-1.5 bg-red-950 border border-red-700/50 hover:bg-red-900 text-red-300 rounded-lg transition"
            >
              ⛈️ {lang === "sw" ? "Mvua Kubwa (Hatari)" : "Flash Storm (Danger)"}
            </button>
          </div>
        </div>
      </main>

      {/* USSD Modal */}
      {showUssdModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div className="text-xs font-mono text-emerald-400">USSD *384*25# Simulator</div>
              <button
                onClick={() => setShowUssdModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-2 py-1 rounded"
              >
                ESC
              </button>
            </div>

            <div className="bg-black/90 font-mono text-emerald-300 p-4 rounded-xl border border-emerald-900/50 min-h-[160px] text-xs space-y-2 leading-relaxed">
              {ussdStep === 1 && (
                <>
                  <p className="font-bold">KilimoCast Huduma ya Wakulima:</p>
                  <p>1. {selectedLoc.name}</p>
                  <p>2. Badilisha Eneo</p>
                  <p>3. Msaada / Extension Desk</p>
                </>
              )}
              {ussdStep === 2 && (
                <>
                  <p className="font-bold text-amber-300">Taarifa ya {selectedLoc.name}:</p>
                  <p>Mvua: {rain24h}mm. Upepo: {windSpeed}km/h.</p>
                  <p>Dawa: {decisions.spray.status === "SAFE" ? "RUHUSA KUPULIZA" : "USIPULIZE LEO"}.</p>
                  <p>Mbolea: {decisions.fert.status === "OPTIMAL" ? "WEKA MBOLEA" : "SUBIRI UNYEVU"}.</p>
                </>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              {ussdStep === 1 ? (
                <button
                  onClick={() => setUssdStep(2)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
                >
                  Tuma [Send 1]
                </button>
              ) : (
                <button
                  onClick={() => setUssdStep(1)}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition"
                >
                  Rudi Nyuma [Back]
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}