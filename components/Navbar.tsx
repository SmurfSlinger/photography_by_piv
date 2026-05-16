type NavbarProps = {
  className?: string;
};

export default function Navbar({className}: NavbarProps) {
  return (
    <nav className={className}>
      <a href="/">Home</a>
      <a href="/portfolio">Portfolio</a>
      <a href="/pricing">Pricing</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  );
}