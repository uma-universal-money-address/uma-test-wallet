export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex flex-col">
        <header
          className="bg-white border-b border-gray-200
          flex-shrink-0 flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center">
            <img
              src="/uma-sandbox-icon.svg"
              alt="Logo"
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center">
            <button className="text-primary text-sm font-medium">
              Sign up
            </button>
            <button className="ml-4 text-primary text-sm font-medium">
              Log in
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
