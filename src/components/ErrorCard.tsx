"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  title: string;
  description: string;
  debugInfo?: any;
  redirectUrl?: string;
  redirectLabel?: string;
}

export default function ErrorCard({
  title,
  description,
  debugInfo,
  redirectUrl,
  redirectLabel = "サインインページへ移動",
}: ErrorCardProps) {
  return (
    <Card className="mb-6 border-red-400 bg-red-50 dark:bg-red-900/20">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {debugInfo && (
          <pre className="bg-white dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {redirectUrl && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = redirectUrl)}
          >
            {redirectLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
