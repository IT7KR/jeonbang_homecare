"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function QrCodePage() {
  const [text, setText] = useState("");
  const [size, setSize] = useState("1000");
  const [color, setColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [margin, setMargin] = useState("20");

  // Using a reliable public API for QR code generation
  // api.qrserver.com is a standard service provided by goqr.me
  const qrUrl = text
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
        text
      )}&margin=${margin}&color=${color.replace(
        "#",
        ""
      )}&bgcolor=${bgColor.replace("#", "")}`
    : "";

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qrcode.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      window.open(qrUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          QR코드 생성
        </h2>
        <p className="text-gray-500 mt-1">
          텍스트나 URL을 입력하여 사용 가능한 QR코드를 실시간으로 생성합니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>정보 입력</CardTitle>
            <CardDescription>
              QR코드로 변환할 내용을 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="qr-text"
                className="text-sm font-medium text-gray-700"
              >
                URL 또는 텍스트
              </Label>
              <Input
                id="qr-text"
                placeholder="https://example.com"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-11 border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="qr-size"
                  className="text-sm font-medium text-gray-700"
                >
                  크기 (px)
                </Label>
                <select
                  id="qr-size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-primary focus:outline-none"
                >
                  <option value="200">200 x 200</option>
                  <option value="500">500 x 500</option>
                  <option value="800">800 x 800</option>
                  <option value="1000">1000 x 1000</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="qr-margin"
                  className="text-sm font-medium text-gray-700"
                >
                  여백
                </Label>
                <select
                  id="qr-margin"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-primary focus:outline-none"
                >
                  <option value="0">없음</option>
                  <option value="10">좁게 (10px)</option>
                  <option value="20">보통 (20px)</option>
                  <option value="40">넓게 (40px)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="qr-color"
                  className="text-sm font-medium text-gray-700"
                >
                  QR코드 색상
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="qr-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 uppercase"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="qr-bgcolor"
                  className="text-sm font-medium text-gray-700"
                >
                  배경 색상
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="qr-bgcolor"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 uppercase"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 border border-blue-100 flex gap-3 text-sm text-blue-700">
              <div className="shrink-0 pt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p>설정값이 즉시 반영됩니다.</p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="shadow-sm border-gray-200 flex flex-col">
          <CardHeader>
            <CardTitle>미리보기</CardTitle>
            <CardDescription>생성된 QR코드입니다.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-gray-50/50 rounded-b-xl">
            {qrUrl ? (
              <div className="space-y-6 text-center w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-48 h-48 md:w-64 md:h-64 object-contain transition-all duration-300"
                    style={{ backgroundColor: bgColor }}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleDownload}
                    className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  >
                    <Download size={16} />
                    이미지 다운로드
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 opacity-50"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
                    />
                  </svg>
                </div>
                <p className="font-medium text-gray-500">입력값이 없습니다</p>
                <p className="text-sm mt-1">
                  좌측에 텍스트를 입력하여
                  <br />
                  QR코드를 생성하세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
