# ASHA-Sahayi backend

    python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    # edit backend/.env  (new Groq + Sarvam keys)
    # save your HTML file as frontend/index.html  (do NOT edit it)
    uvicorn backend.main:app --reload                      # run from THIS folder

Open http://localhost:8000  |  API docs: http://localhost:8000/docs
The server adds i18n.js + api-patch.js to the page when it serves it; your HTML file stays unchanged.
Demo logins: citizen 101/1234, 102/5678, 103/9012. ASHA role needs no PIN unless ASHA_PIN is set.
# ashasahayi
