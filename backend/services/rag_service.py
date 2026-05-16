import os
import shutil
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VECTORSTORE_PATH = os.path.join(BASE_DIR, "data", "vectorstore")
PDF_FOLDER = os.path.join(BASE_DIR, "data", "pdfs_real")
print("PDF PATH:", PDF_FOLDER)
print("VECTOR PATH:", VECTORSTORE_PATH)

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

def get_fallback_docs():
    """Built-in Kerala agriculture knowledge as backup"""
    return [
        Document(page_content="""Kerala major crops: Rice (Paddy), Coconut, Rubber,
        Banana, Pepper, Cardamom, Coffee, Tea, Cashew, Tapioca.
        Kerala rainfall: 3000mm annually. Southwest monsoon June-September.
        Paddy seasons: Virippu (Kharif) June-November, Mundakan September-January.
        Coconut: grows in all 14 districts, needs laterite or sandy loam soil.
        Rubber: mainly Kottayam, Idukki, Pathanamthitta, Kollam districts."""),

        Document(page_content="""Kerala pest management:
        Coconut Rhinoceros Beetle: Use pheromone traps (Coco Trap), naphthalene balls in crown.
        Red Palm Weevil: Pheromone traps, inject Monocrotophos in severe cases.
        Paddy Stem Borer: Pheromone traps, clip seedling tips before transplanting.
        Brown Planthopper: Leave alleys 20cm every 2 meters during transplanting.
        Banana Pseudostem Weevil: Remove infected pseudostems, apply Chlorpyriphos.
        Rubber Phytophthora: Apply Bordeaux mixture, improve drainage."""),

        Document(page_content="""Pesticide formulations registered in India:
        Chlorpyriphos 20% EC - for stem borer, soil pests - 2ml per litre water.
        Imidacloprid 17.8% SL - for sucking pests, planthopper - 0.3ml per litre.
        Carbendazim 50% WP - for fungal diseases, blast - 1g per litre water.
        Mancozeb 75% WP - for blight diseases - 2.5g per litre water.
        Azadirachtin (Neem) 0.03% EC - organic option for all pests - 5ml per litre.
        Copper Oxychloride 50% WP - for bacterial and fungal diseases - 3g per litre.
        Tricyclazole 75% WP - specifically for paddy blast disease - 0.6g per litre."""),

        Document(page_content="""Organic/Natural farming methods (AEFS):
        Beejamrutham: Seed treatment with cow dung 5kg + cow urine 5L + lime 50g in 20L water.
        Soak seeds for 12 hours before sowing. Protects from seed-borne diseases.
        Jeevamrutham: Soil microbe enhancer - cow dung 10kg + cow urine 10L +
        jaggery 1kg + pulse powder 1kg in 200L water. Ferment 5 days. Apply 200L per acre.
        Mulching: Cover soil with crop residues to retain moisture and prevent erosion.
        Pheromone traps: 5-10 traps per acre for stem borer and other moths.
        Yellow sticky traps: 15-20 per acre for leaf hoppers and thrips.
        Neem spray: 5ml Azadirachtin per litre water for organic pest control."""),

        Document(page_content="""Kerala market prices and selling:
        Rubber: Rs 160-180/kg at Rubber Board depots.
        Coconut: Rs 25-35/nut retail, Rs 18-22 copra.
        Paddy MSP: Rs 2183/quintal common variety.
        Banana Nendran: Rs 40-60/kg wholesale.
        Black Pepper: Rs 450-550/kg dried.
        Cardamom: Rs 1200-1600/kg auction.
        Government schemes: PM-KISAN Rs 6000/year, PMFBY crop insurance,
        Kisan Credit Card at 7% interest up to Rs 3 lakh.
        Sell through: Supplyco, Horticorp, cooperatives, e-NAM portal."""),

        Document(page_content="""Paddy cultivation Kerala step by step:
        Land prep: Plough 2-3 times, apply 500kg lime per acre for acidic laterite soil.
        Varieties: Uma, Jyothi, Kanchana, Thavalakar for Kuttanad region.
        Nursery: Sow certified seeds, transplant after 25-30 days.
        Transplanting: 2-3 seedlings per hill, 20x15cm spacing.
        Fertilizer: 40kg Urea + 20kg MOP + 25kg Super Phosphate per acre per season.
        Water: Maintain 5cm depth during vegetative stage.
        Harvest: 110-130 days after transplanting when 80% grains golden yellow."""),

        Document(page_content="""Coconut cultivation Kerala:
        Varieties: West Coast Tall, Chowghat Orange Dwarf, Kalpa Surabhi hybrid.
        Planting: June-July or September-October, 7.5m triangular spacing.
        Fertilizer per palm per year: Urea 50g + Super Phosphate 320g + MOP 200g.
        Apply in April-May and September-October in pits around the palm.
        Intercropping: Banana, cocoa, black pepper to increase income.
        Root Wilt Disease: No cure - use tolerant varieties, maintain soil health.
        Coconut Development Board subsidy available for replanting old palms."""),

        Document(page_content="""Agro-ecological farming benefits:
        Natural farming reduces cost of cultivation by 30-40%.
        Eliminates dependence on chemical fertilizers and pesticides.
        Jeevamrutham and Beejamrutham are low cost farm inputs made on farm.
        Poly cropping with 8-20 crops improves soil microbe diversity.
        Mulching conserves soil moisture and prevents erosion.
        365 days green cover maintains soil organic carbon.
        AEFS farmers report increased yields over 3-5 years as soil health improves.
        Suitable for Kerala's small landholding farmers (average 0.3 hectares)."""),

        Document(page_content="""KAU Package of Practices Kerala crops:
        Rice varieties for Kerala: Jyothi, Uma, Kanchana, Kairali, Aswathy, Sabari.
        Coconut varieties: West Coast Tall, Chowghat Orange Dwarf, Kalpa Surabhi.
        Rubber varieties: RRII 105, RRII 430, GT 1 for Kerala conditions.
        Cardamom: Njallani Green Gold, PV1 for Idukki hills.
        Pepper: Panniyur 1, Sreekara, Pournami for Kerala climate.
        All fertilizer recommendations from KAU are per hectare per season."""),
    ]

def load_pdfs_safely():
    """Load PDFs with smart handling — pop2016 gets priority and more pages"""
    documents = []

    if not os.path.exists(PDF_FOLDER):
        os.makedirs(PDF_FOLDER)
        return documents

    pdf_files = [f for f in os.listdir(PDF_FOLDER) if f.endswith('.pdf')]

    if not pdf_files:
        print("⚠️  No PDFs found in data/pdfs_real/")
        return documents

    # ✅ Priority order — pop2016 is highest value for Kerala farming
    priority_order = [
        'pop2016.pdf',                              # KAU Package of Practices — BEST SOURCE
        'Farmguide-2024.pdf',                       # Farm guide
        'farming.pdf',                              # General farming
        'AEF-basic-concepts.pdf',                  # Agro-ecological farming
        'list_of_pesticide_and_their_formulation.pdf'  # Pesticides
    ]

    # Sort files by priority, unknown files go last
    sorted_pdfs = []
    for p in priority_order:
        if p in pdf_files:
            sorted_pdfs.append(p)
    for f in pdf_files:
        if f not in sorted_pdfs:
            sorted_pdfs.append(f)

    for pdf_file in sorted_pdfs:
        pdf_path = os.path.join(PDF_FOLDER, pdf_file)
        file_size_mb = os.path.getsize(pdf_path) / (1024 * 1024)

        try:
            print(f"   📄 Loading: {pdf_file} ({file_size_mb:.1f}MB)...")
            loader = PyPDFLoader(pdf_path)
            pages = loader.load()
            total_pages = len(pages)

            # ✅ Smart page limits per file
            if pdf_file == 'pop2016.pdf':
                # KAU PoP — 401 pages of pure Kerala crop knowledge
                # Load pages 8-208 (skip intro, get all crop chapters)
                pages = pages[8:208]
                print(f"      ✅ Loaded crop chapters (pages 9-208 of {total_pages})")

            elif pdf_file == 'Farmguide-2024.pdf':
                pages = pages[:80]
                print(f"      ✅ Loaded first 80 pages of {total_pages}")

            elif pdf_file == 'farming.pdf':
                pages = pages[:60]
                print(f"      ✅ Loaded first 60 pages of {total_pages}")

            elif pdf_file == 'AEF-basic-concepts.pdf':
                # Small file — load all
                print(f"      ✅ Loaded all {total_pages} pages")

            elif pdf_file == 'list_of_pesticide_and_their_formulation.pdf':
                # Small file — load all
                print(f"      ✅ Loaded all {total_pages} pages")

            else:
                # Unknown PDF — load first 50 pages safely
                if file_size_mb > 10:
                    pages = pages[:50]
                    print(f"      ✅ Loaded first 50 pages of {total_pages} (large file)")
                else:
                    print(f"      ✅ Loaded all {total_pages} pages")

            documents.extend(pages)
            print(f"      → {len(pages)} pages added to knowledge base")

        except Exception as e:
            print(f"   ❌ Failed to load {pdf_file}: {e}")

    return documents


def build_vectorstore():
    """Build FAISS vectorstore from PDFs + fallback knowledge"""
    print("\n🔨 Building vectorstore...")

    # Load real PDFs
    pdf_docs = load_pdfs_safely()

    # Always include built-in Kerala knowledge as safety net
    fallback_docs = get_fallback_docs()

    all_documents = pdf_docs + fallback_docs
    print(f"\n📊 Total documents loaded: {len(all_documents)}")

    # Split into chunks — smaller chunks = better RAG precision
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=80,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    chunks = splitter.split_documents(all_documents)
    print(f"📊 Total chunks created: {len(chunks)}")

    # Create vectorstore directory
    if not os.path.exists(VECTORSTORE_PATH):
        os.makedirs(VECTORSTORE_PATH)

    # Build FAISS index
    print("⚙️  Building FAISS index (this may take 2-3 minutes for pop2016)...")
    vectorstore = FAISS.from_documents(chunks, embeddings)
    vectorstore.save_local(VECTORSTORE_PATH)
    print("✅ Vectorstore built and saved successfully!\n")

    return vectorstore


def get_vectorstore():
    """Load existing vectorstore or build new one"""
    index_file = os.path.join(VECTORSTORE_PATH, "index.faiss")
    if os.path.exists(index_file):
        return FAISS.load_local(
            VECTORSTORE_PATH,
            embeddings,
            allow_dangerous_deserialization=True
        )
    print("⚠️  Vectorstore not found. Building new one...")
    return build_vectorstore()


def retrieve_context(query: str, k: int = 4) -> str:
    """Retrieve most relevant context for a query"""
    vectorstore = get_vectorstore()
    docs = vectorstore.similarity_search(query, k=k)
    context = "\n\n".join([doc.page_content for doc in docs])
    return context


def rebuild_vectorstore():
    """Force rebuild — call this after adding new PDFs"""
    print("🔄 Rebuilding vectorstore from scratch...")
    if os.path.exists(VECTORSTORE_PATH):
        shutil.rmtree(VECTORSTORE_PATH)
    return build_vectorstore()