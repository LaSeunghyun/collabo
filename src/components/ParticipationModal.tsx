import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";

interface ParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    rewardType: "reward" | "revenue" | "both";
  };
}

const rewardOptions = [
  {
    id: "digital",
    amount: 10000,
    title: "디지털 서포터",
    description: "디지털 앨범 + 감사 메시지",
    items: ["고음질 디지털 앨범", "아티스트 감사 메시지", "프로젝트 업데이트 알림"],
    deliveryDate: "2024년 3월"
  },
  {
    id: "cd",
    amount: 30000,
    title: "CD 콜렉터",
    description: "CD + 포토카드 세트",
    items: ["실물 CD", "한정판 포토카드 5장", "디지털 앨범", "사인 포토카드 1장"],
    deliveryDate: "2024년 4월"
  },
  {
    id: "lp",
    amount: 50000,
    title: "LP 콜렉터",
    description: "LP + 한정판 티셔츠",
    items: ["12인치 LP", "한정판 티셔츠", "포토카드 5장", "앨범 제작 과정 포토북"],
    deliveryDate: "2024년 5월",
    popular: true
  },
  {
    id: "premium",
    amount: 100000,
    title: "프리미엄 서포터",
    description: "앨범 제작 과정 참관 + 사인회 참여",
    items: ["앨범 제작 과정 참관권", "사인회 참여권", "LP + 티셔츠", "개인 감사 영상"],
    deliveryDate: "2024년 3월 ~ 5월",
    limited: 20
  }
];

export function ParticipationModal({ isOpen, onClose, project }: ParticipationModalProps) {
  const [participationType, setParticipationType] = useState<"reward" | "revenue">("reward");
  const [selectedReward, setSelectedReward] = useState(rewardOptions[2].id);
  const [revenueAmount, setRevenueAmount] = useState(100000);
  const [participantInfo, setParticipantInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: ""
  });

  const selectedRewardOption = rewardOptions.find(option => option.id === selectedReward);

  const handleSubmit = () => {
    // 참여 처리 로직
    console.log("참여 정보:", {
      projectId: project.id,
      type: participationType,
      selectedReward: participationType === "reward" ? selectedReward : null,
      amount: participationType === "revenue" ? revenueAmount : selectedRewardOption?.amount,
      participantInfo
    });
    onClose();
  };

  const calculateRevenueShare = (amount: number) => {
    // 10% 참여자 분배 가정
    const totalRevenue = project.targetAmount * 2; // 예상 총 수익
    const participantPool = totalRevenue * 0.1; // 참여자 분배 풀 (10%)
    const expectedReturn = (amount / project.targetAmount) * participantPool;
    return expectedReturn;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle style={{ fontSize: 'var(--text-h2)', color: 'var(--text-primary)' }}>
            프로젝트 참여하기
          </DialogTitle>
          <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
            {project.title}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* 참여 방식 선택 */}
          {project.rewardType === "both" && (
            <div>
              <Label style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                참여 방식 선택
              </Label>
              <Tabs value={participationType} onValueChange={(value) => setParticipationType(value as "reward" | "revenue")} className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="reward">리워드형</TabsTrigger>
                  <TabsTrigger value="revenue">수익분배형</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* 리워드형 참여 */}
          {participationType === "reward" && (
            <div className="space-y-4">
              <div>
                <Label style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  리워드 선택
                </Label>
                <RadioGroup value={selectedReward} onValueChange={setSelectedReward} className="mt-3">
                  <div className="grid gap-3">
                    {rewardOptions.map((option) => (
                      <div key={option.id} className="flex items-start space-x-3">
                        <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                        <Card className={`flex-1 cursor-pointer transition-colors ${selectedReward === option.id ? 'ring-2' : ''}`} 
                              style={{ 
                                ringColor: selectedReward === option.id ? 'var(--action-primary-bg)' : 'transparent',
                                borderColor: selectedReward === option.id ? 'var(--action-primary-bg)' : 'var(--border-light)'
                              }}
                              onClick={() => setSelectedReward(option.id)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CardTitle style={{ fontSize: 'var(--text-h3)', color: 'var(--text-primary)' }}>
                                  {option.title}
                                </CardTitle>
                                {option.popular && (
                                  <Badge style={{ backgroundColor: 'var(--status-success)', color: 'white' }}>
                                    인기
                                  </Badge>
                                )}
                                {option.limited && (
                                  <Badge variant="outline" style={{ color: 'var(--status-alert)' }}>
                                    한정 {option.limited}명
                                  </Badge>
                                )}
                              </div>
                              <span style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {option.amount.toLocaleString()}원
                              </span>
                            </div>
                            <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                              {option.description}
                            </p>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {option.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span style={{ color: 'var(--status-success)' }}>✓</span>
                                  <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-primary)' }}>
                                    {item}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <Separator className="my-3" />
                            <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                              <strong>배송 예정:</strong> {option.deliveryDate}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* 수익분배형 참여 */}
          {participationType === "revenue" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="revenue-amount" style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  참여 금액
                </Label>
                <div className="mt-2">
                  <Input
                    id="revenue-amount"
                    type="number"
                    value={revenueAmount}
                    onChange={(e) => setRevenueAmount(Number(e.target.value))}
                    min={50000}
                    step={10000}
                    className="text-right"
                  />
                  <p style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)', marginTop: 'var(--space-8)' }}>
                    최소 참여 금액: 50,000원
                  </p>
                </div>
              </div>

              <Card style={{ backgroundColor: 'var(--background-muted)', border: '1px solid var(--border-light)' }}>
                <CardHeader>
                  <CardTitle style={{ fontSize: 'var(--text-h3)', color: 'var(--text-primary)' }}>
                    예상 수익 분배
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                        참여 금액
                      </span>
                      <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                        {revenueAmount.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: 'var(--text-body-m)', color: 'var(--text-secondary)' }}>
                        프로젝트 내 비중
                      </span>
                      <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                        {((revenueAmount / project.targetAmount) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                        예상 수익 분배
                      </span>
                      <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'bold', color: 'var(--status-success)' }}>
                        {calculateRevenueShare(revenueAmount).toLocaleString()}원
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                      * 예상 수익은 프로젝트 성과에 따라 달라질 수 있습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 참여자 정보 입력 */}
          <div className="space-y-4">
            <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
              참여자 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={participantInfo.name}
                  onChange={(e) => setParticipantInfo({...participantInfo, name: e.target.value})}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  value={participantInfo.email}
                  onChange={(e) => setParticipantInfo({...participantInfo, email: e.target.value})}
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={participantInfo.phone}
                  onChange={(e) => setParticipantInfo({...participantInfo, phone: e.target.value})}
                  placeholder="연락처를 입력하세요"
                />
              </div>
              {participationType === "reward" && (
                <div>
                  <Label htmlFor="address">배송지 주소</Label>
                  <Input
                    id="address"
                    value={participantInfo.address}
                    onChange={(e) => setParticipantInfo({...participantInfo, address: e.target.value})}
                    placeholder="배송지 주소를 입력하세요"
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="message">응원 메시지 (선택)</Label>
              <Textarea
                id="message"
                value={participantInfo.message}
                onChange={(e) => setParticipantInfo({...participantInfo, message: e.target.value})}
                placeholder="창작자에게 전할 응원 메시지를 작성해주세요"
                rows={3}
              />
            </div>
          </div>

          {/* 결제 정보 */}
          <Card style={{ backgroundColor: 'var(--background-surface)', border: '2px solid var(--border-medium)' }}>
            <CardHeader>
              <CardTitle style={{ fontSize: 'var(--text-h3)', color: 'var(--text-primary)' }}>
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-primary)' }}>
                    {participationType === "reward" ? selectedRewardOption?.title : "수익분배형 참여"}
                  </span>
                  <span style={{ fontSize: 'var(--text-body-l)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                    {participationType === "reward" 
                      ? selectedRewardOption?.amount.toLocaleString() 
                      : revenueAmount.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-primary)' }}>
                    플랫폼 수수료 (5%)
                  </span>
                  <span style={{ fontSize: 'var(--text-body-l)', color: 'var(--text-secondary)' }}>
                    {participationType === "reward" 
                      ? ((selectedRewardOption?.amount ?? 0) * 0.05).toLocaleString() 
                      : (revenueAmount * 0.05).toLocaleString()}원
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    총 결제 금액
                  </span>
                  <span style={{ fontSize: 'var(--text-h3)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {participationType === "reward" 
                      ? ((selectedRewardOption?.amount ?? 0) * 1.05).toLocaleString() 
                      : (revenueAmount * 1.05).toLocaleString()}원
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 order-2 sm:order-1"
            >
              취소
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1 order-1 sm:order-2"
              style={{
                backgroundColor: 'var(--action-primary-bg)',
                color: 'var(--action-primary-text)'
              }}
              disabled={!participantInfo.name || !participantInfo.email}
            >
              <span className="hidden sm:inline">
                {participationType === "reward" 
                  ? ((selectedRewardOption?.amount ?? 0) * 1.05).toLocaleString() 
                  : (revenueAmount * 1.05).toLocaleString()}원 결제하기
              </span>
              <span className="sm:hidden">
                결제하기
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}