"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, FileDown } from "lucide-react";
import { toast, useConfirm } from "@/hooks";
import {
  getQuoteItems,
  createQuoteItem,
  updateQuoteItem,
  deleteQuoteItem,
  downloadQuotePdf,
  type QuoteItem,
  type QuoteItemCreate,
  type QuoteItemUpdate,
  type QuoteSummary,
} from "@/lib/api/admin";
import { numberToKoreanCurrency } from "@/lib/utils/formatters";

interface QuoteItemTableProps {
  assignmentId: number;
  onTotalChange?: (total: number) => void;
}

const UNIT_OPTIONS = [
  { value: "", label: "단위 없음" },
  { value: "개", label: "개" },
  { value: "식", label: "식" },
  { value: "m²", label: "m² (평방미터)" },
  { value: "m", label: "m (미터)" },
  { value: "시간", label: "시간" },
  { value: "일", label: "일" },
  { value: "회", label: "회" },
];

export function QuoteItemTable({
  assignmentId,
  onTotalChange,
}: QuoteItemTableProps) {
  const { confirm } = useConfirm();
  const [summary, setSummary] = useState<QuoteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState<QuoteItemCreate>({
    item_name: "",
    description: "",
    quantity: 1,
    unit: "",
    unit_price: 0,
  });

  // onTotalChange를 ref로 관리하여 무한 루프 방지
  const onTotalChangeRef = useRef(onTotalChange);
  useEffect(() => {
    onTotalChangeRef.current = onTotalChange;
  }, [onTotalChange]);

  // 견적 항목 로드
  const loadQuoteItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getQuoteItems(assignmentId);
      setSummary(data);
      onTotalChangeRef.current?.(data.total_amount);
      setError(null);
    } catch (err) {
      console.error("Failed to load quote items:", err);
      setError("견적 항목을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadQuoteItems();
  }, [loadQuoteItems]);

  // 모달 열기 (추가)
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      item_name: "",
      description: "",
      quantity: 1,
      unit: "",
      unit_price: 0,
    });
    setIsModalOpen(true);
  };

  // 모달 열기 (수정)
  const handleOpenEdit = (item: QuoteItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      description: item.description || "",
      quantity: item.quantity,
      unit: item.unit || "",
      unit_price: item.unit_price,
    });
    setIsModalOpen(true);
  };

  // 저장
  const handleSave = async () => {
    if (!formData.item_name.trim()) {
      toast.warning("항목명을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);

      if (editingItem) {
        // 수정
        const updateData: QuoteItemUpdate = {
          item_name: formData.item_name,
          description: formData.description || undefined,
          quantity: formData.quantity,
          unit: formData.unit || undefined,
          unit_price: formData.unit_price,
        };
        await updateQuoteItem(assignmentId, editingItem.id, updateData);
      } else {
        // 추가
        await createQuoteItem(assignmentId, formData);
      }

      setIsModalOpen(false);
      toast.success("저장되었습니다.");
      await loadQuoteItems();
    } catch (err) {
      console.error("Failed to save quote item:", err);
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 삭제
  const handleDelete = async (item: QuoteItem) => {
    const confirmed = await confirm({
      title: "항목 삭제",
      description: `"${item.item_name}" 항목을 삭제하시겠습니까?`,
      type: "warning",
      confirmText: "삭제",
      confirmVariant: "destructive",
    });

    if (!confirmed) return;

    try {
      await deleteQuoteItem(assignmentId, item.id);
      toast.success("삭제되었습니다.");
      await loadQuoteItems();
    } catch (err) {
      console.error("Failed to delete quote item:", err);
      toast.error("삭제에 실패했습니다.");
    }
  };

  // PDF 다운로드
  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const blob = await downloadQuotePdf(assignmentId);

      // Blob을 다운로드 링크로 변환
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `견적서_${assignmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("PDF가 다운로드되었습니다.");
    } catch (err) {
      console.error("Failed to download PDF:", err);
      toast.error(
        err instanceof Error ? err.message : "견적서 다운로드에 실패했습니다."
      );
    } finally {
      setDownloading(false);
    }
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  };

  // 계산된 금액 미리보기
  const previewAmount = (formData.quantity || 0) * (formData.unit_price || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
        <Button variant="link" onClick={loadQuoteItems} className="ml-2">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">견적 항목</h3>
        <Button onClick={handleOpenAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          항목 추가
        </Button>
      </div>

      {/* 테이블 */}
      {summary && summary.items.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">항목명</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="text-right w-[80px]">수량</TableHead>
                <TableHead className="w-[60px]">단위</TableHead>
                <TableHead className="text-right w-[100px]">단가</TableHead>
                <TableHead className="text-right w-[120px]">금액</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.item_name}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {item.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number.isInteger(item.quantity) ? item.quantity : Math.floor(item.quantity)}
                  </TableCell>
                  <TableCell>{item.unit || "-"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* 합계 행 */}
              <TableRow className="bg-gray-50 font-semibold">
                <TableCell colSpan={5} className="text-right">
                  합계
                </TableCell>
                <TableCell className="text-right text-lg text-primary">
                  {formatCurrency(summary.total_amount)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center text-gray-500">
          견적 항목이 없습니다.
          <br />
          <Button variant="link" onClick={handleOpenAdd}>
            항목 추가하기
          </Button>
        </div>
      )}

      {/* 버튼 영역 */}
      {summary && summary.items.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <FileDown className="h-4 w-4 mr-1" />
            )}
            견적서 다운로드
          </Button>
        </div>
      )}

      {/* 추가/수정 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "견적 항목 수정" : "견적 항목 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 항목명 */}
            <div className="space-y-2">
              <Label htmlFor="item_name">항목명 *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) =>
                  setFormData({ ...formData, item_name: e.target.value })
                }
                placeholder="예: 제초 작업"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="예: 100평 기준"
                rows={2}
              />
            </div>

            {/* 수량 & 단위 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">수량</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">단위</Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 단가 */}
            <div className="space-y-2">
              <Label htmlFor="unit_price">단가 (원)</Label>
              <Input
                id="unit_price"
                type="number"
                min="0"
                step="1000"
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unit_price: parseInt(e.target.value) || 0,
                  })
                }
              />
              {formData.unit_price > 0 && (
                <p className="text-xs text-blue-600">
                  {numberToKoreanCurrency(formData.unit_price)}
                </p>
              )}
            </div>

            {/* 금액 미리보기 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">금액</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(previewAmount)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                = {formData.quantity} ×{" "}
                {formatCurrency(formData.unit_price || 0)}
              </p>
              {previewAmount > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {numberToKoreanCurrency(previewAmount)}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
