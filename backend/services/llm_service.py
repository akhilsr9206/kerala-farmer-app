import os
import base64
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

PRIMARY_KEY = os.getenv("GROQ_API_KEY")
BACKUP_KEY  = os.getenv("GROQ_API_KEY_2")

client_primary = Groq(api_key=PRIMARY_KEY)
client_backup  = Groq(api_key=BACKUP_KEY) if BACKUP_KEY else None

# ── Language auto-detection ───────────────────────────────
MALAYALAM_CHARS = set("അആഇഈഉഊഋഌഎഏഐഒഓഔകഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹളഴറ")

def detect_language(text: str) -> str:
    """Auto-detect if input contains Malayalam characters"""
    for char in text:
        if char in MALAYALAM_CHARS:
            return "malayalam"
    return "english"

def get_lang_instruction(language: str) -> str:
    if language == "malayalam":
        return (
            "IMPORTANT: Respond ONLY in Malayalam script (മലയാളം). "
            "Use clear, simple Malayalam that farmers understand. "
            "Do NOT mix English words unless they are technical terms with no Malayalam equivalent."
        )
    return (
        "Respond in clear, simple English. "
        "Use short sentences. Avoid jargon."
    )

# ── Core LLM caller ───────────────────────────────────────
def _call_groq(messages: list, max_tokens: int = 600, temperature: float = 0.3) -> str:
    """Single function to call Groq with fallback logic"""
    for client, label in [(client_primary, "primary"), (client_backup, "backup")]:
        if not client:
            continue
        try:
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return resp.choices[0].message.content
        except Exception as e:
            err = str(e)
            if "429" in err:
                print(f"⚠️ {label} key rate limited, trying next...")
                continue
            if "decommissioned" in err.lower():
                try:
                    resp = client.chat.completions.create(
                        model="gemma2-9b-it",
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                    )
                    return resp.choices[0].message.content
                except:
                    continue
            print(f"❌ {label} error: {e}")
            break
    return None


# ════════════════════════════════════════════════════════
# MASTER SYSTEM PROMPT — KrishiBot Identity
# ════════════════════════════════════════════════════════
def _master_system(role: str, lang_instruction: str) -> str:
    return f"""You are KrishiBot — Kerala's most trusted AI agricultural advisor.

ROLE: {role}

STRICT RULES:
1. Answer ONLY what is asked. Never add unnecessary context.
2. For simple questions → give direct 2-4 line answers.
3. For complex questions → use clear sections, max 5 points each.
4. Always include specific numbers: doses, quantities, timings, prices.
5. Always mention Kerala-specific varieties, districts, or agencies when relevant.
6. Never say "I think" or "It depends" — give definitive practical answers.
7. If unsure about a specific fact → say "Check with your local Krishi Bhavan".
8. {lang_instruction}

KERALA KNOWLEDGE BASE:
- Districts: TVM, Kollam, Pathanamthitta, Alappuzha, Kottayam, Idukki, Ernakulam, Thrissur, Palakkad, Malappuram, Kozhikode, Wayanad, Kannur, Kasaragod
- Major crops: Paddy, Coconut, Rubber, Banana, Pepper, Cardamom, Tapioca, Ginger, Arecanut
- Seasons: Virippu (Kharif Jun-Nov), Mundakan (Sep-Jan), Puncha (Jan-May)
- Key agencies: KAU Thrissur, Krishi Bhavan, Rubber Board, Coconut Development Board
- Schemes: PM-KISAN (₹6000/yr), PMFBY (crop insurance), Kisan Credit Card (7% loan)"""


# ════════════════════════════════════════════════════════
# 1. GENERAL ASK LLM — used across all modules
# ════════════════════════════════════════════════════════
def ask_llm(prompt: str, system_prompt: str = None,
            language: str = "english") -> str:

    # Auto-detect language if not forced
    detected = detect_language(prompt)
    if detected == "malayalam":
        language = "malayalam"

    lang_instr = get_lang_instruction(language)

    system = system_prompt or _master_system(
        role="General Kerala farming advisor",
        lang_instruction=lang_instr
    )

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=700, temperature=0.3)
    return result or get_fallback_response(prompt)


# ════════════════════════════════════════════════════════
# 2. RAG-ENHANCED CHATBOT
# ════════════════════════════════════════════════════════
def ask_llm_with_context(query: str, context: str,
                          language: str = "english") -> str:

    detected = detect_language(query)
    if detected == "malayalam":
        language = "malayalam"

    lang_instr = get_lang_instruction(language)

    # Classify question complexity for response length control
    simple_keywords = ["price", "when", "where", "what is", "who", "വില", "എന്ന്", "എവിടെ"]
    is_simple = any(kw in query.lower() for kw in simple_keywords)
    length_rule = (
        "Answer in 2-3 sentences only. Be direct."
        if is_simple else
        "Answer in clear sections. Max 5 bullet points per section. Be specific."
    )

    system = f"""{_master_system(
        role="Precision agricultural chatbot using verified Kerala farming documents",
        lang_instruction=lang_instr
    )}

RESPONSE LENGTH RULE: {length_rule}

FEW-SHOT EXAMPLES:
Q: "What is the price of rubber?"
A: "Rubber price in Kerala is ₹160-180/kg at Rubber Board depots. Sell through RSS (Ribbed Smoked Sheet) grading for best price."

Q: "How to treat paddy blast?"
A: "Paddy Blast Treatment:
- Spray Tricyclazole 75% WP at 0.6g/litre water
- Apply at boot leaf stage (before flowering)
- Repeat after 10 days if severe
- Drain field water during spray
- Use resistant variety Jyothi next season"

Q: "coconut fertilizer dose"
A: "Coconut fertilizer per palm per year:
- Urea: 50g | Super Phosphate: 320g | MOP: 200g
- Apply in 2 splits: April-May and September-October
- Dig 30cm deep pits around drip circle
- Add 25kg compost per palm for better uptake"
"""

    prompt = f"""KNOWLEDGE FROM KERALA AGRICULTURE DOCUMENTS:
{context}

FARMER'S QUESTION: {query}

Answer using the knowledge above. If the answer is in the documents, use those exact figures.
If not in documents, use your Kerala farming knowledge."""

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=600, temperature=0.2)
    return result or get_fallback_response(query)


# ════════════════════════════════════════════════════════
# 3. CROP PLAN GENERATOR
# ════════════════════════════════════════════════════════
def ask_llm_crop_plan(crop: str, district: str, soil: str,
                       area: float, season: str, rainfall: float,
                       irrigation: str, fertilizer_kg: float,
                       experience: int, notes: str,
                       language: str = "english") -> str:

    lang_instr = get_lang_instruction(language)

    system = f"""{_master_system(
        role="Kerala crop planning specialist — creates precise week-by-week farm schedules",
        lang_instruction=lang_instr
    )}

OUTPUT FORMAT (always use this exact structure):
WEEK 1-2: [action] — [specific quantity/dose]
WEEK 3-4: [action] — [specific quantity/dose]
MONTH 2: [key activities]
MONTH 3: [harvest/post-harvest]
FERTILIZER SCHEDULE: [doses with timing]
IRRIGATION: [frequency and amount]
WATCH OUT FOR: [2-3 specific risks for this crop/season]
EXPECTED YIELD: [range in tonnes/acre]

Rules: Use exact KAU-recommended doses. Mention specific product names. Be precise."""

    prompt = f"""Create a 3-month crop plan:
Crop: {crop} | District: {district} | Soil: {soil}
Area: {area} acres | Season: {season} | Rainfall: {rainfall}mm
Irrigation: {irrigation} | Fertilizer budget: {fertilizer_kg}kg/acre
Farmer experience: {experience} years
{f'Special notes: {notes}' if notes else ''}"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=800, temperature=0.2)
    return result or f"3-month plan for {crop} in {district}: Contact your Krishi Bhavan for a personalized plan."


# ════════════════════════════════════════════════════════
# 4. CROP GOALS GENERATOR
# ════════════════════════════════════════════════════════
def ask_llm_crop_goals(crop: str, soil: str, area: float,
                        season: str, district: str,
                        rainfall: float, language: str = "english") -> str:

    lang_instr = get_lang_instruction(language)

    system = f"""{_master_system(
        role="Kerala farm goal-setter — gives 3 precise actionable 2-week goals",
        lang_instruction=lang_instr
    )}

OUTPUT FORMAT:
🎯 Goal 1: [specific action] → [expected outcome]
🎯 Goal 2: [specific action] → [expected outcome]  
🎯 Goal 3: [specific action] → [expected outcome]

Each goal must have a specific quantity or measurable target. Max 2 lines per goal."""

    prompt = f"""Set 2-week goals for:
Crop: {crop} | Soil: {soil} | Area: {area} acres
Season: {season} | District: {district} | Rainfall: {rainfall}mm"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=250, temperature=0.2)
    return result or f"🎯 Goal 1: Prepare land with lime application (500kg/acre)\n🎯 Goal 2: Procure certified {crop} seeds from Krishi Bhavan\n🎯 Goal 3: Set up irrigation system before planting"


# ════════════════════════════════════════════════════════
# 5. PEST / DISEASE ANALYZER (text-only)
# ════════════════════════════════════════════════════════
def ask_llm_pest_text(crop: str, district: str,
                       symptoms: str, language: str = "english") -> str:

    detected = detect_language(symptoms)
    if detected == "malayalam":
        language = "malayalam"

    lang_instr = get_lang_instruction(language)

    system = f"""{_master_system(
        role="Kerala plant pathologist — diagnoses crop diseases and prescribes treatments",
        lang_instruction=lang_instr
    )}

OUTPUT FORMAT (always use exactly):
🔍 DIAGNOSIS: [disease/pest name] | Risk: [Low/Medium/High/Critical]
📋 SYMPTOMS MATCH: [what confirms this diagnosis]
⚡ TODAY: [single most important immediate action]
🌿 ORGANIC TREATMENT: [product + exact dose + method]
💊 CHEMICAL TREATMENT: [registered pesticide + dose + safety interval]
🛡️ PREVENTION: [1-2 specific prevention steps for next season]
📞 HELP: [specific Kerala agency/contact]

Be definitive. Give exact doses. Use registered pesticide names."""

    prompt = f"""Diagnose this crop problem:
Crop: {crop} | District: {district}
Symptoms: {symptoms}"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=500, temperature=0.2)
    return result or f"🔍 DIAGNOSIS: Consult Krishi Bhavan in {district} for exact diagnosis.\n📞 HELP: Visit your nearest Krishi Bhavan with a sample of the affected plant."


# ════════════════════════════════════════════════════════
# 6. COMMON PESTS BY DISTRICT
# ════════════════════════════════════════════════════════
def ask_llm_common_pests(district: str, language: str = "english") -> str:

    lang_instr = get_lang_instruction(language)

    system = f"""{_master_system(
        role="Kerala pest surveillance expert — lists district-specific current threats",
        lang_instruction=lang_instr
    )}

OUTPUT FORMAT for each pest:
**[Number]. [Pest Name]** (Malayalam: [local name if known])
- Crops affected: [list]
- Warning signs: [specific visual cues]
- Quick fix: [organic remedy with dose]
- Peak season: [months]

List exactly 5 pests. Be specific to {district} district."""

    prompt = f"List 5 most common current crop pests in {district} district, Kerala."

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=600, temperature=0.3)
    return result or f"Contact {district} Krishi Bhavan for current pest alerts in your area."


# ════════════════════════════════════════════════════════
# 7. YIELD EXPLANATION
# ════════════════════════════════════════════════════════
def ask_llm_yield_explanation(crop: str, area: float, district: str,
                               rainfall: float, soil: str, irrigation: str,
                               predicted: float, price: float,
                               income: float, language: str = "english") -> str:

    lang_instr = get_lang_instruction(language)

    system = f"""{_master_system(
        role="Kerala yield analyst — interprets ML predictions and gives improvement advice",
        lang_instruction=lang_instr
    )}

OUTPUT FORMAT:
📊 YIELD RATING: [Good/Average/Below Average] — [one-line reason]
💰 INCOME ESTIMATE: ₹[amount] (at ₹[price]/kg)
📈 TOP 3 IMPROVEMENTS:
  1. [specific action] → +[X]% yield
  2. [specific action] → +[X]% yield
  3. [specific action] → +[X]% yield
🏪 BEST MARKET: [specific market name in Kerala]
🏛️ SCHEME: [one relevant government scheme with brief details]

Keep each point to 1-2 lines. Use specific numbers."""

    # Kerala average yields for comparison
    avg_yields = {
        'paddy': 2.2, 'coconut': 1.3, 'rubber': 1.4, 'banana': 18.0,
        'pepper': 0.5, 'cardamom': 0.08, 'tapioca': 11.0, 'ginger': 4.9,
        'arecanut': 1.3, 'turmeric': 2.0, 'cashew': 0.5
    }
    avg = avg_yields.get(crop.lower(), 1.5)
    rating = "Good" if predicted/area > avg else ("Average" if predicted/area > avg*0.7 else "Below Average")

    prompt = f"""Yield analysis:
Crop: {crop} | Area: {area} acres | District: {district}
Rainfall: {rainfall}mm | Soil: {soil} | Irrigation: {irrigation}
XGBoost predicted: {predicted:.2f} tonnes | Kerala avg: {avg:.2f} tonnes/acre
Rating: {rating} | Price: ₹{price}/kg | Est. income: ₹{income:,.0f}"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=400, temperature=0.2)
    return result or f"📊 YIELD RATING: {rating}\n💰 INCOME ESTIMATE: ₹{income:,.0f}\n📈 Contact KAU for improvement recommendations."


# ════════════════════════════════════════════════════════
# 8. MARKET SELLING STRATEGY
# ════════════════════════════════════════════════════════
def ask_llm_market_strategy(crop: str, quantity: float, district: str,
                             price: float, source: str,
                             estimated_value: float,
                             language: str = "english") -> str:

    lang_instr = get_lang_instruction(language)

    system = f"""{_master_system(
        role="Kerala agricultural market advisor — gives precise selling strategies",
        lang_instruction=lang_instr
    )}

OUTPUT FORMAT:
💡 SELL NOW OR WAIT: [definitive recommendation + reason]
🏪 BEST MARKET: [specific market name, location, contact if known]
🤝 COOPERATIVE OPTION: [specific cooperative or e-NAM details]
💎 VALUE ADDITION: [1-2 specific processing ideas to increase income]
📅 BEST TIME: [specific month or season to sell for max price]

Max 2 lines per point. Give specific names, not generic advice."""

    prompt = f"""Selling strategy for:
Crop: {crop} | Quantity: {quantity}kg | District: {district}
Current price: ₹{price}/kg ({source}) | Est. value: ₹{estimated_value:,.0f}"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=350, temperature=0.3)
    return result or f"💡 SELL NOW OR WAIT: Sell now if price is above MSP.\n🏪 BEST MARKET: Contact {district} Krishi Bhavan for nearest mandi."


# ════════════════════════════════════════════════════════
# 9. NUTRITION & RECIPES
# ════════════════════════════════════════════════════════
def ask_llm_nutrition(crop: str, language: str = "english") -> str:

    lang_instr = get_lang_instruction(language)

    system = f"""{_master_system(
        role="Kerala nutrition and food expert — gives crop nutritional value and local recipes",
        lang_instruction=lang_instr
    )}

OUTPUT FORMAT:
🥗 NUTRITIONAL VALUE: [key nutrients per 100g]
❤️ HEALTH BENEFITS: [2-3 specific benefits]
🍳 KERALA RECIPES:
  1. [recipe name] — [2-line preparation]
  2. [recipe name] — [2-line preparation]
  3. [recipe name] — [2-line preparation]

Keep it practical and Kerala-specific."""

    prompt = f"Nutritional value and Kerala recipes for {crop}."

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=400, temperature=0.4)
    return result or f"Contact Kerala Agricultural University for nutritional details on {crop}."


# ════════════════════════════════════════════════════════
# 10. DASHBOARD INSIGHTS
# ════════════════════════════════════════════════════════
def ask_llm_dashboard_insights(name: str, district: str,
                                crops: list, total_land: float,
                                logs_count: int, badges: int,
                                language: str = "english") -> str:

    lang_instr = get_lang_instruction(language)

    system = f"""{_master_system(
        role="Kerala farm performance analyst — gives personalized actionable insights",
        lang_instruction=lang_instr
    )}

OUTPUT FORMAT (exactly 3 insights):
💡 Insight 1: [specific recommendation] → [expected benefit]
💡 Insight 2: [specific recommendation] → [expected benefit]
💡 Insight 3: [specific recommendation] → [expected benefit]

Each insight must be specific to the farmer's actual crops and district.
Max 2 lines per insight. Include specific numbers or product names."""

    crops_str = ", ".join(crops) if crops else "No crops logged yet"

    prompt = f"""Farm profile:
Farmer: {name} | District: {district}
Crops: {crops_str} | Total land: {total_land:.1f} acres
Logs: {logs_count} | Badges: {badges}"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": prompt},
    ]

    result = _call_groq(messages, max_tokens=300, temperature=0.3)
    return result or "💡 Insight 1: Log your crops regularly to get personalized recommendations.\n💡 Insight 2: Visit your local Krishi Bhavan for free soil testing.\n💡 Insight 3: Apply for PM-KISAN scheme for ₹6000/year direct benefit."


# ════════════════════════════════════════════════════════
# 11. VISION — IMAGE ANALYSIS
# ════════════════════════════════════════════════════════
def analyze_crop_image(image_bytes: bytes, crop_name: str,
                        district: str, symptoms: str,
                        language: str = "english") -> str:

    detected = detect_language(symptoms or "")
    if detected == "malayalam":
        language = "malayalam"

    lang_instr = get_lang_instruction(language)
    image_b64  = base64.b64encode(image_bytes).decode('utf-8')

    system = f"""{_master_system(
        role="Expert plant pathologist — diagnoses crop diseases from images",
        lang_instruction=lang_instr
    )}

OUTPUT FORMAT:
🔍 DIAGNOSIS: [disease/pest name] | Confidence: [High/Medium/Low]
🚨 SEVERITY: [Low/Medium/High/Critical]
📋 VISUAL EVIDENCE: [what you see in the image that confirms diagnosis]
⚡ TODAY: [single most urgent action]
🌿 ORGANIC TREATMENT: [exact product + dose]
💊 CHEMICAL TREATMENT: [registered pesticide + dose + waiting period]
🛡️ PREVENTION: [1-2 steps for next season]
📞 HELP: [Kerala-specific agency]"""

    user_prompt = f"""Analyze this crop image:
Crop: {crop_name} | District: {district}
Farmer reports: {symptoms or 'No symptoms described — analyze image'}"""

    try:
        # Try vision model
        for client in [client_primary, client_backup]:
            if not client:
                continue
            try:
                resp = client.chat.completions.create(
                    model="meta-llama/llama-4-scout-17b-16e-instruct",
                    messages=[
                        {"role": "system", "content": system},
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_b64}"
                                    }
                                },
                                {"type": "text", "text": user_prompt}
                            ]
                        }
                    ],
                    max_tokens=600,
                    temperature=0.2
                )
                return resp.choices[0].message.content
            except Exception as e:
                if "429" in str(e):
                    continue
                break

        # Fallback to text analysis
        return ask_llm_pest_text(crop_name, district, symptoms, language)

    except Exception as e:
        print(f"Vision error: {e}")
        return ask_llm_pest_text(crop_name, district, symptoms, language)


# ════════════════════════════════════════════════════════
# FALLBACK RESPONSES
# ════════════════════════════════════════════════════════
def get_fallback_response(prompt: str) -> str:
    p = prompt.lower()

    if any(w in p for w in ["coconut", "തേങ്ങ"]):
        return (
            "**Coconut (Kerala):**\n"
            "• Fertilizer/palm/year: Urea 50g + SP 320g + MOP 200g\n"
            "• Apply: April-May & September-October\n"
            "• Rhinoceros beetle: Coco Trap pheromone + naphthalene balls in crown\n"
            "• Red palm weevil: Pheromone traps; inject Monocrotophos if severe\n"
            "• Market: ₹25-35/nut | Contact: Coconut Development Board\n"
            "⚠️ Offline mode — visit Krishi Bhavan for updated advice."
        )

    if any(w in p for w in ["paddy", "rice", "നെല്ല്"]):
        return (
            "**Paddy (Kerala):**\n"
            "• Varieties: Jyothi, Uma, Kanchana (general); Thavalakar (Kuttanad)\n"
            "• Spacing: 20×15cm | Seedlings: 2-3/hill\n"
            "• Fertilizer/acre: Basal: SP 25kg+MOP 10kg → Tillering: Urea 20kg\n"
            "• Stem borer: Pheromone traps 5-6/acre; clip seedling tips at transplanting\n"
            "• Harvest: 110-130 days | MSP: ₹2183/quintal\n"
            "⚠️ Offline mode — visit Krishi Bhavan for updated advice."
        )

    if any(w in p for w in ["pest", "disease", "കീട", "രോഗം"]):
        return (
            "**Pest Management (Kerala):**\n"
            "• Organic: Neem oil 5ml/L | Jeevamrutham spray\n"
            "• Stem borer: Chlorpyriphos 20% EC 2ml/L\n"
            "• Fungal: Carbendazim 50% WP 1g/L\n"
            "• Bacterial: Copper Oxychloride 50% WP 3g/L\n"
            "• Pheromone traps: 5-10/acre\n"
            "⚠️ Offline mode — visit Krishi Bhavan for exact diagnosis."
        )

    if any(w in p for w in ["market", "price", "വില"]):
        return (
            "**Kerala Market Prices (Reference):**\n"
            "• Rubber: ₹165/kg | Coconut: ₹28/nut\n"
            "• Pepper: ₹480/kg | Cardamom: ₹1350/kg\n"
            "• Paddy: ₹21/kg (MSP) | Banana: ₹40/kg\n"
            "• Ginger: ₹80/kg | Arecanut: ₹250/kg\n"
            "• Sell via: Supplyco, Horticorp, e-NAM, cooperatives\n"
            "⚠️ Offline mode — check Agmarknet for live prices."
        )

    return (
        "**Kerala Farming — Quick Reference:**\n"
        "• Krishi Bhavan: Available in every panchayat (free advisory)\n"
        "• KAU Thrissur: 0487-2438011 (expert consultation)\n"
        "• PM-KISAN: ₹6000/year direct benefit\n"
        "• PMFBY: Crop insurance scheme\n"
        "• e-NAM: Online crop selling portal\n"
        "⚠️ AI temporarily unavailable. Resets at midnight."
    )