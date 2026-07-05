# 🧠 Nalarku.ai — Belajar Lebih Cerdas

Nalarku.ai adalah platform pembelajaran adaptif berbasis *Artificial Intelligence* (AI) yang dirancang untuk membantu pelajar dan mahasiswa belajar dengan lebih cerdas. Aplikasi ini menawarkan fitur analisis gaya belajar, pembuatan kuis otomatis dari presentasi (PPT), asisten AI (Nala AI), hingga pengecekan plagiarisme.

![Nalarku.ai Banner](https://via.placeholder.com/1200x400.png?text=Nalarku.ai+Banner) <!-- Ganti dengan link gambar banner aslimu -->

## ✨ Fitur Utama

*   **🤖 Asisten Belajar (Nala AI):** Chatbot AI cerdas yang siap menjawab pertanyaan, memberikan ringkasan materi, dan memberikan rekomendasi belajar secara *real-time*.
*   **📝 Kuis Otomatis (Ujian):** Unggah file PPT/PPTX, dan AI akan secara otomatis mengekstrak materi untuk membuat soal latihan pilihan ganda.
*   **⏱️ Pomodoro Timer:** Timer belajar terintegrasi dengan mode *Focus*, *Short Break*, dan *Long Break* untuk manajemen waktu belajar yang efektif.
*   **📊 Dasbor & Analitik Belajar:** Pantau *streak* belajar harian, kartu materi yang diselesaikan, dan analisis waktu belajar optimalmu.
*   **🏆 Gamifikasi & Peringkat:** Dapatkan XP setiap menjawab kuis dengan benar, naikkan level, dan pantau peringkat globalmu di *Leaderboard*.
*   **🔍 Pengecek Plagiarisme:** Deteksi kemiripan teks dengan sumber internet, jurnal ilmiah, dan deteksi teks AI bawaan.
*   **🧑‍🎓 Personalisasi Onboarding:** Sesuaikan pengalaman belajar berdasarkan tujuan, jenjang pendidikan, dan gaya belajar favoritmu (Visual, Auditori, dll).

## 🛠️ Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan arsitektur *Single Page Application* (SPA) murni dengan teknologi *Frontend* modern tanpa framework berat, serta integrasi *Backend* berbasis AI.

*   **Frontend:** HTML5, CSS3 (Vanilla, CSS Variables, Flexbox/Grid), JavaScript (Vanilla ES6).
*   **Font & Icon:** Plus Jakarta Sans & SVG Icons bawaan.
*   **Backend / Middleware (Webhook):** Terintegrasi menggunakan [n8n](https://n8n.io/) untuk mengatur logika AI dan koneksi database.
*   **Database:** Supabase (diakses via *webhook* n8n).
*   **AI Engine:** Anthropic Claude (via API/n8n) untuk *generator* kuis dan *plagiarism checker*.

## 🚀 Cara Menjalankan Secara Lokal

Karena proyek ini berjalan penuh di sisi klien (*client-side*), kamu tidak perlu melakukan instalasi dependensi atau *build process* yang rumit.

1.  **Clone repositori ini:**
    ```bash
    git clone [https://github.com/username-kamu/nalarku-ai.git](https://github.com/username-kamu/nalarku-ai.git)
    ```
2.  **Masuk ke direktori proyek:**
    ```bash
