
import { Button } from '@heroui/react';
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-kinu text-sumi">
      <div className="flex flex-col bg-sheet p-5 rounded-lg w-full max-w-md text-center ">
        <h1 className="text-3xl font-bold my-4 text-gold-deep py-4">404 - Page Not Found</h1>
        <p className="text-gold-deep pb-10">The page you are looking for does not exist.</p>
        <Button className="w-full my-2 bg-gold text-sumi hover:bg-gold-deep" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );
}