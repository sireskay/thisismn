'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@saas/auth/hooks/use-session';
import { Button } from '@ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Alert, AlertDescription } from '@ui/components/alert';
import { Label } from '@ui/components/label';
import { Input } from '@ui/components/input';
import { Textarea } from '@ui/components/textarea';
import { RadioGroup, RadioGroupItem } from '@ui/components/radio-group';
import { Upload, Building, FileText, Mail, AlertCircle, CheckCircle, Phone } from 'lucide-react';
import { apiClient } from '@shared/lib/api-client';

interface ClaimBusinessPageProps {
  params: Promise<{
    businessId: string;
  }>;
}

type VerificationType = 'DOMAIN' | 'DOCUMENT' | 'PHONE' | 'MAIL';

export default function ClaimBusinessPage({ params }: ClaimBusinessPageProps) {
  const { businessId } = use(params);
  const router = useRouter();
  const { user } = useSession();
  const [verificationType, setVerificationType] = useState<VerificationType>('DOMAIN');
  const [verificationData, setVerificationData] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError('');

    try {
      const api = apiClient as any;
      const response = await api.business[':id'].claim.$post({
        param: { id: businessId },
        json: {
          verificationType,
          verificationData,
          documents,
          additionalInfo,
        },
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/app/business');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit claim');
      }
    } catch (err) {
      setError('An error occurred while submitting your claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In a real app, you would upload these files to a storage service
    // For now, we'll just store the file names
    const fileNames = Array.from(files).map(file => file.name);
    setDocuments(prev => [...prev, ...fileNames]);
  };

  if (success) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Claim Submitted Successfully</h2>
              <p className="text-muted-foreground">
                We'll review your claim and notify you within 2-3 business days.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to your dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Claim Your Business</CardTitle>
          <CardDescription>
            Verify your ownership to manage this business listing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Verification Method */}
            <div className="space-y-3">
              <Label>Verification Method</Label>
              <RadioGroup value={verificationType} onValueChange={(value) => setVerificationType(value as VerificationType)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="DOMAIN" className="mt-1" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="font-medium">Domain Verification</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Verify using your business website domain
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="DOCUMENT" className="mt-1" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Document Upload</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload business registration documents
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="PHONE" className="mt-1" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">Phone Verification</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Verify using the business phone number
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="MAIL" className="mt-1" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="font-medium">Mail Verification</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive a verification code by mail
                      </p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Verification Data Input */}
            <div className="space-y-2">
              <Label htmlFor="verificationData">
                {verificationType === 'DOMAIN' && 'Business Domain'}
                {verificationType === 'PHONE' && 'Business Phone Number'}
                {verificationType === 'MAIL' && 'Business Mailing Address'}
                {verificationType === 'DOCUMENT' && 'Additional Information'}
              </Label>
              <Input
                id="verificationData"
                value={verificationData}
                onChange={(e) => setVerificationData(e.target.value)}
                placeholder={
                  verificationType === 'DOMAIN' ? 'example.com' :
                  verificationType === 'PHONE' ? '(612) 555-0123' :
                  verificationType === 'MAIL' ? '123 Main St, Minneapolis, MN 55401' :
                  'Provide any additional details'
                }
                required={verificationType !== 'DOCUMENT'}
              />
            </div>

            {/* Document Upload for DOCUMENT type */}
            {verificationType === 'DOCUMENT' && (
              <div className="space-y-2">
                <Label htmlFor="documents">Business Documents</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload business registration, license, or tax documents
                  </p>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                  {documents.length > 0 && (
                    <div className="mt-4 text-left">
                      <p className="text-sm font-medium mb-2">Uploaded files:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {documents.map((doc, index) => (
                          <li key={index}>• {doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
              <Textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Provide any additional information that might help verify your ownership..."
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !verificationData}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}