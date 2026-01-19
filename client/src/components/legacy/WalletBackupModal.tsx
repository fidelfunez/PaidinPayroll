import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Copy, Eye, EyeOff, Shield, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletBackupModalProps {
  open: boolean;
  mnemonic: string;
  onConfirmed: () => void;
  onSkip?: () => void;
}

export function WalletBackupModal({ open, mnemonic, onConfirmed, onSkip }: WalletBackupModalProps) {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Verification state
  const [verificationWord1, setVerificationWord1] = useState("");
  const [verificationWord2, setVerificationWord2] = useState("");
  const [verificationError, setVerificationError] = useState(false);

  const words = mnemonic.split(' ').filter(Boolean);
  
  // Select two random word positions for verification (but keep them consistent per session)
  // Using word positions 3 and 17 (0-indexed: 2 and 16) for consistency
  const VERIFY_WORD_1_POS = 2; // Word #3
  const VERIFY_WORD_2_POS = 16; // Word #17

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setRevealed(false);
      setConfirmed(false);
      setCopied(false);
      setVerificationWord1("");
      setVerificationWord2("");
      setVerificationError(false);
    }
  }, [open]);

  // Check verification when both words are entered
  useEffect(() => {
    if (verificationWord1 && verificationWord2 && words.length >= 18) {
      const word1Correct = verificationWord1.toLowerCase().trim() === words[VERIFY_WORD_1_POS]?.toLowerCase();
      const word2Correct = verificationWord2.toLowerCase().trim() === words[VERIFY_WORD_2_POS]?.toLowerCase();
      setVerificationError(!(word1Correct && word2Correct));
    } else {
      setVerificationError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationWord1, verificationWord2, mnemonic]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Remember: writing it down offline is safer",
        variant: "default",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please write down the words manually",
        variant: "destructive",
      });
    }
  };

  // Compute verification status
  const isVerificationValid = () => {
    if (!verificationWord1 || !verificationWord2) return false;
    const word1Correct = verificationWord1.toLowerCase().trim() === words[VERIFY_WORD_1_POS]?.toLowerCase();
    const word2Correct = verificationWord2.toLowerCase().trim() === words[VERIFY_WORD_2_POS]?.toLowerCase();
    return word1Correct && word2Correct;
  };

  const handleVerificationCheck = () => {
    if (!verificationWord1 || !verificationWord2) {
      setVerificationError(false);
      return;
    }
    const isValid = isVerificationValid();
    setVerificationError(!isValid);
  };

  const verificationPassed = isVerificationValid();
  const canConfirm = revealed && confirmed && verificationPassed;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirmed();
    }
  };

  // Show verification section only after phrase is revealed
  const showVerification = revealed && words.length >= 18;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto p-0 gap-0 bg-white backdrop-blur-none">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 px-6 py-8 rounded-t-lg">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-3xl font-bold text-white mb-2">
                  Secure Account Recovery
                </DialogTitle>
                <DialogDescription className="text-base text-orange-50 leading-relaxed">
                  Save your recovery phrase to restore access if you lose your device.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Important Notice */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-lg text-amber-900">
                  Important: Save this phrase securely
                </h3>
                <p className="text-sm leading-relaxed text-amber-800">
                  If you lose access to this device, this recovery phrase is the only way to restore your account. 
                  PaidIn cannot recover it for you. Write it down and store it somewhere safe offline.
                </p>
              </div>
            </div>
          </div>

          {/* Recovery Phrase Display */}
          <Card className="border-2 border-gray-300 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <p className="text-base font-semibold text-gray-900">Recovery Phrase (24 words)</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRevealed(!revealed)}
                    className="gap-2 border-gray-300 hover:bg-gray-100"
                  >
                    {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {revealed ? 'Hide' : 'Reveal'}
                  </Button>
                </div>
              </div>

              {revealed ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                    {words.map((word, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3.5 bg-white rounded-lg border-2 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 group"
                      >
                        <span className="text-xs font-bold text-gray-400 font-mono min-w-[28px] group-hover:text-orange-500 transition-colors">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-base font-semibold text-gray-900 flex-1">{word}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <p className="text-sm text-center text-gray-700 font-medium">
                      Write these words down in order on paper or another secure offline location.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className={`gap-2 border-gray-300 hover:bg-gray-100 text-xs ${
                          copied ? 'bg-green-50 border-green-300 text-green-700' : ''
                        }`}
                      >
                        <Copy className="w-3 h-3" />
                        {copied ? 'Copied' : 'Copy as backup'}
                      </Button>
                      {copied && (
                        <p className="text-xs text-amber-700">
                          Writing it down is safer than keeping it on your device
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                    {Array.from({ length: 24 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3.5 bg-gray-100 rounded-lg border-2 border-gray-200"
                      >
                        <span className="text-xs font-bold text-gray-400 font-mono min-w-[28px]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-base font-medium text-gray-400 flex-1">••••••</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-center text-gray-600 leading-relaxed">
                      Click "Reveal" to see your recovery phrase. You'll need to write it down.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Verification Step */}
          {showVerification && (
            <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-base text-gray-900 mb-1">
                      Quick verification
                    </h3>
                    <p className="text-sm text-gray-700">
                      Enter these two words to confirm you've saved your phrase:
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Word #{VERIFY_WORD_1_POS + 1}
                    </label>
                    <Input
                      type="text"
                      value={verificationWord1}
                      onChange={(e) => setVerificationWord1(e.target.value)}
                      placeholder="Enter word"
                      className={verificationError ? "border-red-300 focus-visible:ring-red-500" : ""}
                      onBlur={handleVerificationCheck}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Word #{VERIFY_WORD_2_POS + 1}
                    </label>
                    <Input
                      type="text"
                      value={verificationWord2}
                      onChange={(e) => setVerificationWord2(e.target.value)}
                      placeholder="Enter word"
                      className={verificationError ? "border-red-300 focus-visible:ring-red-500" : ""}
                      onBlur={handleVerificationCheck}
                    />
                  </div>
                </div>
                
                {verificationError && (
                  <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Those words don't match. Please check and try again.
                  </p>
                )}
                
                {!verificationError && verificationPassed && (
                  <p className="text-sm text-green-700 mt-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Verification complete
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <input
              type="checkbox"
              id="backup-confirmed"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-blue-300 text-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 cursor-pointer"
            />
            <label htmlFor="backup-confirmed" className="text-sm font-medium text-gray-900 cursor-pointer leading-relaxed flex-1">
              <span className="font-semibold text-blue-900">I understand:</span> I've saved my recovery phrase securely. 
              I know PaidIn cannot recover my account if I lose this phrase.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            {onSkip && (
              <Button
                variant="outline"
                onClick={onSkip}
                className="flex-1 h-12 text-base font-semibold border-2 border-gray-300 hover:bg-gray-50"
              >
                Skip for Now
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`flex-1 h-12 text-base font-semibold shadow-lg transition-all duration-200 ${
                !canConfirm
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-xl'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Continue
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-center text-gray-500 leading-relaxed pt-2">
            You can access this phrase again in your account settings if needed.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
