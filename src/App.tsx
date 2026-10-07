import { Link } from "react-router";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-kinu text-sumi">
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="flex w-full max-w-xl flex-col items-center gap-4 bg-sheet p-10 text-center shadow-[4px_4px_0_0_#1c1814]">
          <span className="hanko" aria-hidden="true">
            改
          </span>
          <h1 className="text-3xl font-bold">Hello World</h1>
          <h2 className="text-2xl font-semibold text-gold-deep">Welcome to Kaizen</h2>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
          <p className="text-gold-deep">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
          <Link
            to="/login"
            className="mt-2 bg-gold px-6 py-2 font-medium text-sumi"
          >
            Continue
          </Link>
        </div>
      </main>
      <footer className="px-6 py-4 text-center text-gold-deep">
        <p>Copyright 2026 Kaizen</p>
      </footer>
    </div>
  )
}

export default App
