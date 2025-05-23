'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/components/table';
import { Badge } from '@ui/components/badge';
import { Button } from '@ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@ui/components/dialog';
import { Skeleton } from '@ui/components/skeleton';
import { Label } from '@ui/components/label';
import { Textarea } from '@ui/components/textarea';
import { FileText, Globe, Phone, Mail, Check, X, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface BusinessClaim {
  id: string;
  businessId: string;
  business: {
    name: string;
    slug: string;
  };
  userId: string;
  user: {
    name: string;
    email: string;
  };
  verificationType: string;
  verificationData: string;
  documents: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
  reviewedById?: string;
  reviewNotes?: string;
  createdAt: string;
}

export default function AdminClaimsPage() {
  const queryClient = useQueryClient();
  const [selectedClaim, setSelectedClaim] = useState<BusinessClaim | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Fetch claims
  const { data: claims, isLoading } = useQuery({
    queryKey: ['admin', 'claims'],
    queryFn: async () => {
      const api = apiClient as any;
      const response = await api.admin.claims.$get();
      if (!response.ok) throw new Error('Failed to fetch claims');
      return response.json() as Promise<BusinessClaim[]>;
    },
  });

  // Approve claim mutation
  const approveMutation = useMutation({
    mutationFn: async ({ claimId, notes }: { claimId: string; notes: string }) => {
      const api = apiClient as any;
      const response = await api.admin.claims[':id'].approve.$post({
        param: { id: claimId },
        json: { notes },
      });
      if (!response.ok) throw new Error('Failed to approve claim');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'claims'] });
      setIsReviewDialogOpen(false);
      setSelectedClaim(null);
      setReviewNotes('');
    },
  });

  // Reject claim mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ claimId, notes }: { claimId: string; notes: string }) => {
      const api = apiClient as any;
      const response = await api.admin.claims[':id'].reject.$post({
        param: { id: claimId },
        json: { notes },
      });
      if (!response.ok) throw new Error('Failed to reject claim');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'claims'] });
      setIsReviewDialogOpen(false);
      setSelectedClaim(null);
      setReviewNotes('');
    },
  });

  const getVerificationIcon = (type: string) => {
    switch (type) {
      case 'DOMAIN':
        return <Globe className="h-4 w-4" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4" />;
      case 'PHONE':
        return <Phone className="h-4 w-4" />;
      case 'MAIL':
        return <Mail className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge status="info">Pending</Badge>;
      case 'APPROVED':
        return <Badge status="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge status="error">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Claims</CardTitle>
            <CardDescription>
              Review and manage business ownership claims
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims?.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{claim.business.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {claim.businessId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{claim.user.name}</p>
                        <p className="text-sm text-muted-foreground">{claim.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getVerificationIcon(claim.verificationType)}
                        <span className="text-sm">{claim.verificationType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(claim.createdAt), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setIsReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {claims?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No claims to review
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Business Claim</DialogTitle>
            <DialogDescription>
              Review the claim details and approve or reject the ownership request
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business</p>
                  <p className="font-medium">{selectedClaim.business.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Claimant</p>
                  <p className="font-medium">{selectedClaim.user.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedClaim.user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verification Type</p>
                  <div className="flex items-center gap-2">
                    {getVerificationIcon(selectedClaim.verificationType)}
                    <span>{selectedClaim.verificationType}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verification Data</p>
                  <p className="font-mono text-sm">{selectedClaim.verificationData}</p>
                </div>
              </div>

              {selectedClaim.documents.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Documents</p>
                  <ul className="space-y-1">
                    {selectedClaim.documents.map((doc, index) => (
                      <li key={index} className="text-sm">• {doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <Label htmlFor="reviewNotes">Review Notes</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReviewDialogOpen(false);
                setSelectedClaim(null);
                setReviewNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={() => {
                if (selectedClaim) {
                  rejectMutation.mutate({
                    claimId: selectedClaim.id,
                    notes: reviewNotes,
                  });
                }
              }}
              disabled={rejectMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => {
                if (selectedClaim) {
                  approveMutation.mutate({
                    claimId: selectedClaim.id,
                    notes: reviewNotes,
                  });
                }
              }}
              disabled={approveMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}