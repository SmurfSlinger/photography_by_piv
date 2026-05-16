import Image from "next/image";
import "./globals.css";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <header>
          <h1 className="text-5xl font-bold mt-5">Photography by Piv</h1>
          <Navbar className="flex justify-around my-5"></Navbar>
        </header>
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
      <div>
        <h2>Main content</h2>
      </div>
      </main>
    </div>
  );
}
