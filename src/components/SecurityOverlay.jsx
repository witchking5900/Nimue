// "WE FIGHT" PROTOCOL: SECURITY DISABLED
// This component now does nothing but render the app normally.

export default function SecurityOverlay({ children }) {
  return (
    <div className="w-full h-full">
      {children}
    </div>
  );
}