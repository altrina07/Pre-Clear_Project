import { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Package,
  MapPin,
  DollarSign,
  Eye,
  MessageCircle,
  FileSearch,
  Upload
} from 'lucide-react';
import { shipmentsStore } from '../../store/shipmentsStore';
import { useShipments } from '../../hooks/useShipments';
import { ShipmentChatPanel } from '../ShipmentChatPanel';

export function PendingReview({ onNavigate }) {
  const { brokerApprove, brokerRequestDocuments, shipments } = useShipments();
  const [pendingShipments, setPendingShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedShipmentForChat, setSelectedShipmentForChat] = useState(null);
  const [showDocRequestModal, setShowDocRequestModal] = useState(false);
  const [docRequestShipmentId, setDocRequestShipmentId] = useState(null);
  const [docRequestMessage, setDocRequestMessage] = useState('');
  const [requestedDocNames, setRequestedDocNames] = useState([]);

  // Load pending shipments from the store subscription
  useEffect(() => {
    const pending = shipments.filter(s => 
      s.brokerApproval === 'pending' || 
      s.brokerApproval === 'documents-requested' ||
      s.status === 'awaiting-broker'
    );
    setPendingShipments(pending);
    
    // Auto-select the shipment if we have one selected with a valid ID
    if (selectedShipment?.id) {
      const updatedSelected = pending.find(s => s.id === selectedShipment.id);
      if (updatedSelected) {
        setSelectedShipment(updatedSelected);
      }
    }
  }, [shipments, selectedShipment?.id]);
  
  // Helper function to get currency based on origin country
  const getCurrency = (originCountry) => {
    const currencyMap = {
      'CN': 'CNY',
      'IN': 'INR',
      'JP': 'JPY',
      'US': 'USD',
      'GB': 'GBP',
      'EU': 'EUR',
      'CA': 'CAD',
      'AU': 'AUD'
    };
    return currencyMap[originCountry] || 'USD';
  };

  const handleApprove = (shipmentId) => {
    brokerApprove(shipmentId, 'Approved by broker after document review.');
    setSelectedShipment(null);
  };

  const handleRequestDocuments = (shipmentId) => {
    setDocRequestShipmentId(shipmentId);
    setShowDocRequestModal(true);
    setDocRequestMessage('');
    setRequestedDocNames([]);
  };

  const submitDocumentRequest = () => {
    if (docRequestShipmentId && requestedDocNames.length > 0 && docRequestMessage) {
      const docs = requestedDocNames.map(name => ({
        name,
        type: name.toLowerCase().includes('invoice') ? 'invoice' :
              name.toLowerCase().includes('packing') ? 'packing-list' :
              name.toLowerCase().includes('certificate') ? 'certificate' :
              name.toLowerCase().includes('specification') ? 'specification' : 'other'
      }));
      
      brokerRequestDocuments(docRequestShipmentId, docs, docRequestMessage);
      setShowDocRequestModal(false);
      setDocRequestShipmentId(null);
    }
  };

  const handleOpenChat = (shipmentId) => {
    setSelectedShipmentForChat(shipmentId);
    setChatOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">Pending Reviews</h1>
        <p className="text-slate-600">Review and approve shipment documentation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-600 text-sm">Pending Review</p>
              <p className="text-slate-900 text-2xl">
                {pendingShipments.filter(s => s.brokerApproval === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-slate-600 text-sm">Docs Requested</p>
              <p className="text-slate-900 text-2xl">
                {pendingShipments.filter(s => s.brokerApproval === 'documents-requested').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-slate-600 text-sm">Total This Week</p>
              <p className="text-slate-900 text-2xl">{pendingShipments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shipments List */}
      {pendingShipments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-slate-900 mb-2">No Pending Reviews</h3>
          <p className="text-slate-600">All shipments have been reviewed. New submissions will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingShipments.map((shipment) => (
            <div key={shipment.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Shipment Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-slate-900 text-xl">Shipment {shipment.id}</h3>
                      {shipment.brokerApproval === 'pending' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                      {shipment.brokerApproval === 'documents-requested' && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Docs Requested
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm">Submitted: {shipment.date}</p>
                  </div>
                  <button
                    onClick={() => setSelectedShipment(selectedShipment?.id === shipment.id ? null : shipment)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {selectedShipment?.id === shipment.id ? 'Hide Details' : 'Review Details'}
                  </button>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Product</p>
                    <p className="text-slate-900">{shipment.productName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Route</p>
                    <p className="text-slate-900">{shipment.originCountry} → {shipment.destCountry}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Value</p>
                    <p className="text-slate-900">{getCurrency(shipment.originCountry)} {shipment.value}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm mb-1">AI Status</p>
                    {shipment.aiApproval === 'approved' ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Approved ({shipment.aiScore}%)
                      </span>
                    ) : (
                      <span className="text-orange-600">Pending</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedShipment?.id === shipment.id && (
                <div className="p-6 bg-slate-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Shipment Details */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <h4 className="text-slate-900 mb-3">Shipment Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">HS Code:</span>
                            <span className="text-slate-900">{shipment.hsCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Weight:</span>
                            <span className="text-slate-900">{shipment.weight} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Quantity:</span>
                            <span className="text-slate-900">{shipment.quantity} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Currency:</span>
                            <span className="text-slate-900">{getCurrency(shipment.originCountry)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <h4 className="text-slate-900 mb-3">Description</h4>
                        <p className="text-slate-600 text-sm">
                          {shipment.productDescription || 'No description provided'}
                        </p>
                      </div>
                    </div>

                    {/* Right Column - Documents & Actions */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <h4 className="text-slate-900 mb-3">Uploaded Documents</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-slate-700">Commercial Invoice</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-slate-700">Packing List</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-slate-700">Product Images</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <h4 className="text-slate-900 mb-3">AI Evaluation Results</h4>
                        {shipment.aiApproval === 'approved' ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-green-900 text-sm mb-1">AI Approved</p>
                                <p className="text-green-700 text-xs">
                                  All automated compliance checks passed
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-orange-900 text-sm">AI evaluation pending</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleApprove(shipment.id)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Shipment
                    </button>
                    <button
                      onClick={() => handleRequestDocuments(shipment.id)}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Request Additional Documents
                    </button>
                    <button
                      onClick={() => handleOpenChat(shipment.id)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Message Shipper
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat Panel */}
      {selectedShipmentForChat && (
        <ShipmentChatPanel
          shipmentId={selectedShipmentForChat}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          userRole="broker"
          userName="Customs Broker"
        />
      )}

      {/* Document Request Modal */}
      {showDocRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-slate-900 text-xl mb-4">Request Additional Documents</h3>
            
            <div className="mb-4">
              <label className="block text-slate-700 mb-2">Document Names (one per line)</label>
              <textarea
                value={requestedDocNames.join('\n')}
                onChange={(e) => setRequestedDocNames(e.target.value.split('\n').filter(Boolean))}
                className="w-full p-3 border border-slate-300 rounded-lg h-32"
                placeholder="Safety Certificate&#10;Technical Specifications&#10;ISO Certification"
              />
            </div>

            <div className="mb-6">
              <label className="block text-slate-700 mb-2">Message to Shipper</label>
              <textarea
                value={docRequestMessage}
                onChange={(e) => setDocRequestMessage(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg h-24"
                placeholder="Please provide the following additional documents for customs clearance..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDocRequestModal(false);
                  setDocRequestShipmentId(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDocumentRequest}
                disabled={requestedDocNames.length === 0 || !docRequestMessage}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}