# 📚 NovelVerse

> Transform anime episodes into immersive light novels with AI. Your universe of anime stories.

NovelVerse is a modern web application that combines anime discovery, AI-powered novel generation, and interactive reading experiences. Discover anime, generate AI-written light novels from episodes, and chat with an AI assistant about characters and plot points.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=flat-square&logo=google)

## ✨ Features

### 🎬 Anime Discovery
- **Latest Anime**: Browse current season's anime with high-quality images
- **Search**: Find any anime instantly with real-time search
- **Episode Details**: View episode lists with TMDB images and descriptions
- **Season Navigation**: Navigate through anime seasons and related series

### 📖 AI Novel Generation
- **Episode to Novel**: Convert any anime episode into a light novel format
- **Batch Generation**: Generate novels for entire seasons
- **Smart Status Detection**: Auto-detects existing novels to prevent duplicates
- **Novel Library**: Manage and browse all your generated novels

### 📚 Reading Experience
- **Theme Switcher**: Light, Dark, and Sepia reading modes
- **Font Controls**: Adjustable font sizes for comfortable reading
- **Progress Tracking**: Saves your reading position automatically
- **Responsive Design**: Optimized for all screen sizes

### 🤖 AI Chat Assistant
- **Context-Aware**: Understands the anime and episode you're reading
- **Character Info**: Ask about characters, techniques, and plot points
- **Floating Interface**: Non-intrusive chat button in reader
- **Powered by Gemini**: Uses Google's latest AI model

### ❤️ Favorites System
- **One-Click Favorites**: Save anime with heart icon
- **Persistent Storage**: Favorites saved in browser localStorage
- **Dedicated Page**: View all your favorite anime in one place

## 🛠 Tech Stack

### Frontend
- **Next.js 15.5** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons

### APIs & Services
- **Jikan API** - Anime data from MyAnimeList
- **TMDB API** - High-quality episode images
- **Google Gemini AI** - Novel generation and chat assistant

### Storage
- **localStorage** - Client-side storage for novels and favorites

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- API Keys:
  - [Google Gemini API Key](https://makersuite.google.com/app/apikey)
  - [TMDB API Key](https://www.themoviedb.org/settings/api)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd AnimeProject
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
TMDB_API_KEY=your_tmdb_api_key_here
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `GEMINI_API_KEY`
   - `TMDB_API_KEY`
5. Deploy!

Your app will be live at `your-app-name.vercel.app`

### Alternative Platforms
- **Netlify**: Requires Netlify Functions adapter
- **Railway**: Good for persistent storage needs
- **Render**: Similar deployment process

## 📱 Usage

### Discover Anime
1. Browse latest anime on the homepage
2. Use the search bar to find specific titles
3. Click on any anime to view details and episodes

### Generate Novels
1. Navigate to an anime detail page
2. Select episodes using checkboxes
3. Click "Generate Novels" button
4. Wait for AI to create your novel (30-60 seconds per episode)
5. Access from the Novels library page

### Read & Chat
1. Open any novel from the library
2. Use reading controls (theme, font size)
3. Click the chat button to ask questions
4. Get AI-powered answers about characters and plot

### Manage Favorites
1. Click the heart icon on any anime card
2. View all favorites at `/favorites`
3. Remove by clicking heart again

## 🎨 Features in Detail

### Novel Generation
- Uses Google Gemini 2.0 Flash for fast, high-quality output
- Converts episode synopsis into engaging narrative prose
- Maintains anime themes and character voices
- Stored locally for offline reading

### Chat Assistant
- Context-aware of current anime and episode
- Answers questions about characters, abilities, and plot
- Powered by Gemini 2.5 Flash
- Displays errors clearly for debugging

### Smart Caching
- In-memory caching for API responses
- Reduces load times and API rate limiting
- Graceful degradation on rate limits

## 🔒 Privacy

- **No user accounts** - All data stored locally in your browser
- **No tracking** - We don't collect any personal information
- **API keys** - Your API keys are only used server-side, never exposed to clients

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Jikan API](https://jikan.moe/) - Unofficial MyAnimeList API
- [TMDB](https://www.themoviedb.org/) - The Movie Database
- [Google Gemini](https://ai.google.dev/) - AI model for generation and chat
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

## 🐛 Issues & Support

Found a bug or have a suggestion? Please open an issue on GitHub.

---

**Made with ❤️ using Next.js and Google Gemini AI**
