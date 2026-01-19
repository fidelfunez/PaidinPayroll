import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface TestCase {
  id: string;
  name: string;
  description: string;
  input: string;
  expectedValid: boolean;
  category: 'mainnet-address' | 'mainnet-xpub' | 'testnet' | 'invalid';
}

interface TestResult {
  success: boolean;
  response?: any;
  error?: string;
}

const TEST_CASES: TestCase[] = [
  // Mainnet Addresses
  {
    id: 'legacy-p2pkh',
    name: 'Legacy P2PKH',
    description: "Satoshi's genesis block address",
    input: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    expectedValid: true,
    category: 'mainnet-address'
  },
  {
    id: 'p2sh',
    name: 'P2SH Address',
    description: 'Script Hash address (starts with 3)',
    input: '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy',
    expectedValid: false,  // This address has an invalid checksum
    category: 'invalid'
  },
  {
    id: 'p2sh-valid',
    name: 'P2SH Address (Valid)',
    description: 'Valid Script Hash address',
    input: '3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64',
    expectedValid: true,
    category: 'mainnet-address'
  },
  {
    id: 'segwit-p2wpkh',
    name: 'Native SegWit',
    description: 'Bech32 P2WPKH (starts with bc1q)',
    input: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    expectedValid: true,
    category: 'mainnet-address'
  },
  {
    id: 'taproot',
    name: 'Taproot P2TR',
    description: 'Taproot address (starts with bc1p)',
    input: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
    expectedValid: true,
    category: 'mainnet-address'
  },
  
  // Extended Public Keys
  {
    id: 'xpub',
    name: 'xpub (BIP44)',
    description: 'Legacy extended public key',
    input: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz',
    expectedValid: true,
    category: 'mainnet-xpub'
  },
  {
    id: 'ypub',
    name: 'ypub (BIP49)',
    description: 'P2SH-SegWit extended public key',
    input: 'ypub6Ww3ibxVfGzLrAH1PNcjyAWenMTbbAosGNB6VvmSEgytSER9azLDWCxoJwW7Ke7icmizBMXrzBx9979FfaHxHcrArf3zbeJJJUZPf663zsP',
    expectedValid: true,
    category: 'mainnet-xpub'
  },
  {
    id: 'zpub',
    name: 'zpub (BIP84)',
    description: 'Native SegWit extended public key',
    input: 'zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs',
    expectedValid: true,
    category: 'mainnet-xpub'
  },
  
  // Testnet
  {
    id: 'testnet-p2pkh',
    name: 'Testnet P2PKH',
    description: 'Testnet legacy address',
    input: 'mkHS9ne12qx9pS9VojpwU5xtRd4T7X7ZUt',
    expectedValid: true,
    category: 'testnet'
  },
  {
    id: 'testnet-segwit',
    name: 'Testnet SegWit',
    description: 'Testnet native SegWit',
    input: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    expectedValid: true,
    category: 'testnet'
  },
  
  // Invalid cases
  {
    id: 'invalid-checksum',
    name: 'Invalid Checksum',
    description: 'Wrong checksum (last digit changed)',
    input: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfN9',
    expectedValid: false,
    category: 'invalid'
  },
  {
    id: 'random-string',
    name: 'Random String',
    description: 'Not a Bitcoin address at all',
    input: 'thisisnotabitcoinaddress',
    expectedValid: false,
    category: 'invalid'
  },
  {
    id: 'empty-string',
    name: 'Empty Input',
    description: 'Empty string test',
    input: '',
    expectedValid: false,
    category: 'invalid'
  },
];

export default function TestValidationPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [testingAll, setTestingAll] = useState(false);

  const testCase = async (testCase: TestCase) => {
    const testId = testCase.id;
    
    setLoading(prev => ({ ...prev, [testId]: true }));
    
    try {
      const response = await fetch('/api/accounting/wallets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: testCase.input }),
      });

      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [testId]: {
          success: true,
          response: data,
        }
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [testId]: {
          success: false,
          error: error.message,
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testId]: false }));
    }
  };

  const testAll = async () => {
    setTestingAll(true);
    setResults({});
    
    for (const tc of TEST_CASES) {
      await testCase(tc);
      // Small delay between tests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setTestingAll(false);
  };

  const clearResults = () => {
    setResults({});
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'mainnet-address':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mainnet-xpub':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'testnet':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'invalid':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'mainnet-address':
        return 'Mainnet Address';
      case 'mainnet-xpub':
        return 'Extended Public Key';
      case 'testnet':
        return 'Testnet';
      case 'invalid':
        return 'Invalid Cases';
      default:
        return category;
    }
  };

  const getTestStats = () => {
    const total = TEST_CASES.length;
    const tested = Object.keys(results).length;
    const passed = Object.values(results).filter(r => {
      if (!r.response) return false;
      const testCase = TEST_CASES.find(tc => results[tc.id] === r);
      if (!testCase) return false;
      return r.response.valid === testCase.expectedValid;
    }).length;
    
    return { total, tested, passed };
  };

  const stats = getTestStats();
  
  // Group test cases by category
  const groupedTests = TEST_CASES.reduce((acc, testCase) => {
    if (!acc[testCase.category]) {
      acc[testCase.category] = [];
    }
    acc[testCase.category].push(testCase);
    return acc;
  }, {} as Record<string, TestCase[]>);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bitcoin Validation Test Suite</h1>
        <p className="text-gray-600 mb-6">
          Comprehensive testing for all Bitcoin address types and extended public keys
        </p>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="text-sm text-gray-600">Total Tests</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <div className="text-sm text-gray-600">Tested</div>
            <div className="text-2xl font-bold text-green-600">{stats.tested}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
            <div className="text-sm text-gray-600">Passed</div>
            <div className="text-2xl font-bold text-purple-600">{stats.passed}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={testAll}
            disabled={testingAll}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {testingAll ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing All...
              </>
            ) : (
              'Test All Cases'
            )}
          </Button>
          <Button
            onClick={clearResults}
            variant="outline"
            disabled={Object.keys(results).length === 0}
          >
            Clear Results
          </Button>
        </div>
      </div>

      {/* Test Cases by Category */}
      <div className="space-y-8">
        {Object.entries(groupedTests).map(([category, tests]) => (
          <div key={category}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Badge className={getCategoryBadgeColor(category)}>
                {getCategoryName(category)}
              </Badge>
              <span className="text-gray-400 text-lg">
                {tests.length} {tests.length === 1 ? 'test' : 'tests'}
              </span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tests.map((tc) => {
                const result = results[tc.id];
                const isLoading = loading[tc.id];
                const hasResult = !!result;
                const isValid = result?.response?.valid;
                const matchesExpected = isValid === tc.expectedValid;

                return (
                  <Card key={tc.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{tc.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {tc.description}
                          </CardDescription>
                        </div>
                        {hasResult && (
                          <div className="ml-2">
                            {matchesExpected ? (
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Input */}
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">INPUT:</div>
                        <code className="block bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs break-all font-mono">
                          {tc.input || '(empty string)'}
                        </code>
                      </div>

                      {/* Test Button */}
                      <Button
                        onClick={() => testCase(tc)}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test This Case'
                        )}
                      </Button>

                      {/* Result */}
                      {hasResult && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-500 mb-2">RESULT:</div>
                          {result.success ? (
                            <div className={`border rounded-lg p-3 text-xs space-y-2 ${
                              matchesExpected 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Valid:</span>
                                <Badge variant={isValid ? 'default' : 'destructive'}>
                                  {isValid ? 'Yes' : 'No'}
                                </Badge>
                              </div>
                              
                              {result.response.addressType && (
                                <div>
                                  <span className="font-medium">Type:</span>{' '}
                                  {result.response.addressType}
                                </div>
                              )}
                              
                              {result.response.xpubType && (
                                <div>
                                  <span className="font-medium">Type:</span>{' '}
                                  {result.response.xpubType}
                                </div>
                              )}
                              
                              {result.response.network && (
                                <div>
                                  <span className="font-medium">Network:</span>{' '}
                                  {result.response.network}
                                </div>
                              )}
                              
                              {result.response.description && (
                                <div>
                                  <span className="font-medium">Description:</span>{' '}
                                  {result.response.description}
                                </div>
                              )}
                              
                              {result.response.error && (
                                <div className="text-red-600">
                                  <span className="font-medium">Error:</span>{' '}
                                  {result.response.error}
                                </div>
                              )}
                              
                              {result.response.sampleAddresses && result.response.sampleAddresses.length > 0 && (
                                <div>
                                  <div className="font-medium mb-1">Sample Derived Addresses:</div>
                                  <div className="space-y-1 ml-2">
                                    {result.response.sampleAddresses.map((addr: string, idx: number) => (
                                      <code key={idx} className="block text-xs bg-white/50 px-2 py-1 rounded">
                                        {addr}
                                      </code>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {!matchesExpected && (
                                <div className="mt-2 text-red-600 font-medium">
                                  ⚠️ Unexpected result! Expected valid={tc.expectedValid.toString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
                              <div className="text-red-600">
                                <span className="font-medium">Error:</span>{' '}
                                {result.error}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
