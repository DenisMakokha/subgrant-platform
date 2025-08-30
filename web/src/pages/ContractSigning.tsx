import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getContractById, getLatestContractArtifact, downloadContractDocument } from '../services/contracts';
import { Contract, ContractArtifact } from '../types';

const ContractSigning: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [artifact, setArtifact] = useState<ContractArtifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (contractId: string) => {
    try {
      setLoading(true);
      const [contractData, artifactData] = await Promise.all([
        getContractById(contractId),
        getLatestContractArtifact(contractId).catch(() => null)
      ]);
      setContract(contractData);
      setArtifact(artifactData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch contract data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!artifact) return;
    
    try {
      setDownloading(true);
      await downloadContractDocument(artifact.id);
      // Handle the downloaded file (e.g., open in new tab or save to disk)
      alert('Document downloaded successfully!');
    } catch (err) {
      setError('Failed to download document');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      ready: 'bg-blue-100 text-blue-800',
      sent: 'bg-yellow-100 text-yellow-800',
      partially_signed: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      filed: 'bg-gray-100 text-gray-800',
      declined: 'bg-red-100 text-red-800',
      voided: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
          Contract not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contract Signing</h1>
        <p className="text-gray-600">Review and sign the contract</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Contract Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{contract.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{contract.description || 'No description provided'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  {getStatusBadge(contract.status)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(contract.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Document</h2>
            {artifact ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Name</label>
                  <p className="mt-1 text-sm text-gray-900">{artifact.document_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Version</label>
                  <p className="mt-1 text-sm text-gray-900">{artifact.version}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">MIME Type</label>
                  <p className="mt-1 text-sm text-gray-900">{artifact.mime_type}</p>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {downloading ? 'Downloading...' : 'Download Document'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-gray-500 text-center">No document available for this contract.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sign Contract</h2>
        {contract.status === 'ready' || contract.status === 'sent' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800">
                This contract is ready to be signed. Please review the document and follow the instructions
                sent to your email to complete the signing process.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Back
              </button>
            </div>
          </div>
        ) : contract.status === 'completed' ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">
              This contract has been successfully signed by all parties.
            </p>
          </div>
        ) : contract.status === 'partially_signed' ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800">
              This contract has been partially signed. Please wait for other parties to complete the signing process.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <p className="text-gray-800">
              This contract is not available for signing at this time. Current status: {contract.status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractSigning;
export {};