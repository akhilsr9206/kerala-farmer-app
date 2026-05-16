import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.rag_service import rebuild_vectorstore, retrieve_context

print("=" * 50)
print("  RAG System Test")
print("=" * 50)

# Force complete rebuild
print("\n🔄 Forcing complete vectorstore rebuild...")
rebuild_vectorstore()

# Test queries
test_queries = [
    "paddy cultivation Kerala",
    "coconut pest management",
    "cardamom fertilizer dose",
]

print("\n🔍 Testing retrieval:")
for query in test_queries:
    print(f"\nQuery: '{query}'")
    context = retrieve_context(query, k=2)
    print(f"Retrieved ({len(context)} chars):")
    print(context[:300])
    print("...")