import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Package,
  MapPin,
  FileText,
  Zap,
  MessageCircle,
  Upload,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useShipments } from '../../hooks/useShipments';
import { getCurrencyByCountry } from '../../utils/validation';
import { ShipmentChatPanel } from '../ShipmentChatPanel';
import { shipmentsStore } from '../../store/shipmentsStore';

export function BrokerReviewShipment({ shipment, onNavigate }) {
  const { brokerApprove, brokerDeny } = useShipments();
  const [currentShipment, setCurrentShipment] = useState(shipment);
  const [chatOpen, setChatOpen] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showDocRequestModal, setShowDocRequestModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [brokerNotes, setBrokerNotes] = useState('');
  const [docRequestMessage, setDocRequestMessage] = useState('');
  const [requestedDocNames, setRequestedDocNames] = useState([]);

  // Get origin country currency
  const currency = getCurrencyByCountry(currentShipment.originCountry || 'US');

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = shipmentsStore.subscribe(() => {
      const updated = shipmentsStore.getShipmentById(shipment.id);
      if (updated) {
        setCurrentShipment(updated);
      }
    });
    return () => unsubscribe();
  }, [shipment.id]);

  const handleApprove = () => {
    shipmentsStore.brokerApprove(currentShipment.id, brokerNotes || 'Approved after document review.');
    setShowApproveConfirm(false);
    
    // Add notification for shipper
    shipmentsStore.addNotification({
      id: `notif-${Date.now()}`,
      type: 'broker-approved',
      title: 'Shipment Approved!',
      message: `Your shipment #${currentShipment.id} has been approved by the broker. Token generated.`,
      shipmentId: currentShipment.id,
      timestamp: new Date().toISOString(),
      read: false,
      recipientRole: 'shipper'
    });
    
    onNavigate('broker-dashboard');
  };

  const handleDeny = () => {
    if (denyReason.trim()) {
      shipmentsStore.brokerDeny(currentShipment.id, denyReason);
      
      // Add notification for shipper
      shipmentsStore.addNotification({
        id: `notif-${Date.now()}`,
        type: 'broker-denied',
        title: 'Shipment Denied',
        message: `Your shipment #${currentShipment.id} has been denied by the broker. Reason: ${denyReason}`,
        shipmentId: currentShipment.id,
        timestamp: new Date().toISOString(),
        read: false,
        recipientRole: 'shipper'
      });
      
      setShowDenyModal(false);
      onNavigate('broker-dashboard');
    }
  };

  const handleRequestDocuments = () => {
    if (requestedDocNames.length > 0 && docRequestMessage) {
      const docs = requestedDocNames.map(name => ({
        name,
        type: name.toLowerCase().includes('invoice') ? 'invoice' :
              name.toLowerCase().includes('packing') ? 'packing-list' :
              name.toLowerCase().includes('certificate') ? 'certificate' :
              name.toLowerCase().includes('specification') ? 'specification' : 'document'
      }));
      
      shipmentsStore.brokerRequestDocuments(currentShipment.id, docs, docRequestMessage);
      
      // Add notification for shipper
      shipmentsStore.addNotification({
        id: `notif-${Date.now()}`,
        type: 'documents-requested',
        title: 'Additional Documents Requested',
        message: `Broker has requested additional documents for shipment #${currentShipment.id}`,
        shipmentId: currentShipment.id,
        timestamp: new Date().toISOString(),
        read: false,
        recipientRole: 'shipper'
      });
      
      setShowDocRequestModal(false);
      onNavigate('broker-dashboard');
    }
  };

  const aiScore = currentShipment.aiScore || 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => onNavigate('broker-dashboard')}
          className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-900 mb-2">Review Shipment #{currentShipment.id}</h1>
            <p className="text-slate-600">Detailed compliance review and approval</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">AI Compliance Score</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      aiScore >= 80 ? 'bg-green-500' : 
                      aiScore >= 60 ? 'bg-amber-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${aiScore}%` }}
                  />
                </div>
                <span className={`text-lg ${
                  aiScore >= 80 ? 'text-green-700' : 
                  aiScore >= 60 ? 'text-amber-700' : 
                  'text-red-700'
                }`}>
                  {aiScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipper Details */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-slate-900 mb-4">Shipper Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Shipper Name</p>
                <p className="text-slate-900">{currentShipment.shipperName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Shipper ID</p>
                <p className="text-slate-900">{currentShipment.shipperId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Origin Country</p>
                <p className="text-slate-900">{currentShipment.originCountry}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Origin City</p>
                <p className="text-slate-900">{currentShipment.originCity}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Origin Address</p>
                <p className="text-slate-900 text-sm">{currentShipment.originAddress}</p>
              </div>
            </div>
          </div>

          {/* Origin & Destination */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-slate-900 mb-4">Origin & Destination</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-slate-900">Origin</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-700">{currentShipment.originAddress}</p>
                  <p className="text-slate-700">{currentShipment.originCity}, {currentShipment.originCountry}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-slate-900">Destination</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-700">{currentShipment.destAddress}</p>
                  <p className="text-slate-700">{currentShipment.destCity}, {currentShipment.destCountry}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-slate-900">Product Details</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Product Name</p>
                <p className="text-slate-900">{currentShipment.productName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-slate-700 text-sm">{currentShipment.productDescription || 'No description provided'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">HS Code</p>
                <p className="text-slate-900">{currentShipment.hsCode}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Quantity</p>
                <p className="text-slate-900">{currentShipment.quantity} units</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Weight</p>
                <p className="text-slate-900">{currentShipment.weight} kg</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Product Value</p>
                <p className="text-slate-900">{currency.symbol}{currentShipment.value} {currency.code}</p>
              </div>
            </div>

            {/* Multiple Products */}
            {currentShipment.products && currentShipment.products.length > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-700 mb-3">Additional Products:</p>
                {currentShipment.products.slice(1).map((product, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg mb-2">
                    <p className="text-sm text-slate-900 mb-1">{product.name}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span>HS: {product.hsCode}</span>
                      <span>Qty: {product.quantity}</span>
                      <span>Value: {currency.symbol}{product.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Compliance Flags */}
          {currentShipment.aiResults && currentShipment.aiResults.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <h2 className="text-slate-900">AI Compliance Flags</h2>
              </div>
              
              <div className="space-y-3">
                {currentShipment.aiResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'passed' ? 'bg-green-50 border-green-200' :
                      result.status === 'warning' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.status === 'passed' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                      {result.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                      {result.status === 'failed' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                      
                      <div className="flex-1">
                        <p className={`text-sm mb-1 ${
                          result.status === 'passed' ? 'text-green-900' :
                          result.status === 'warning' ? 'text-amber-900' :
                          'text-red-900'
                        }`}>
                          {result.title}
                        </p>
                        <p className="text-xs text-slate-600">{result.description}</p>
                        {result.suggestion && (
                          <p className="text-xs text-slate-500 mt-1">💡 {result.suggestion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Status */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-slate-900">Document Status</h2>
            </div>
            
            <div className="space-y-2">
              {currentShipment.documents && currentShipment.documents.length > 0 ? (
                currentShipment.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {doc.uploaded ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm text-slate-900">{doc.name}</p>
                        {doc.uploaded && doc.uploadedAt && (
                          <p className="text-xs text-slate-500">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      doc.uploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {doc.uploaded ? 'Uploaded' : 'Missing'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No documents uploaded yet</p>
              )}
            </div>
          </div>

          {/* Broker Notes */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-slate-900 mb-4">Notes to Shipper (Optional)</h2>
            <textarea
              value={brokerNotes}
              onChange={(e) => setBrokerNotes(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Add any notes or comments for the shipper..."
            />
          </div>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowApproveConfirm(true)}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Approve Shipment
              </button>
              
              <button
                onClick={() => setShowDocRequestModal(true)}
                className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Request Documents
              </button>
              
              <button
                onClick={() => setShowDenyModal(true)}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Deny Shipment
              </button>
              
              <button
                onClick={() => setChatOpen(true)}
                className="w-full px-4 py-3 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Message Shipper
              </button>
            </div>
          </div>

          {/* Shipment Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-slate-900 mb-4">Shipment Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Shipment ID:</span>
                <span className="text-slate-900">{currentShipment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className="text-slate-900">{currentShipment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">AI Approval:</span>
                <span className={currentShipment.aiApproval === 'approved' ? 'text-green-600' : 'text-amber-600'}>
                  {currentShipment.aiApproval}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Created:</span>
                <span className="text-slate-900">
                  {new Date(currentShipment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-slate-900 mb-2">Approve Shipment?</h3>
                <p className="text-slate-600 text-sm">
                  This will generate a token for shipment #{currentShipment.id} and notify the shipper.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-slate-900 mb-4">Deny Shipment</h3>
            <p className="text-slate-600 text-sm mb-4">
              Please provide a reason for denying this shipment:
            </p>
            <textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-4"
              rows={4}
              placeholder="Enter reason for denial..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDenyModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeny}
                disabled={!denyReason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Denial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Documents Modal */}
      {showDocRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-slate-900 mb-4">Request Additional Documents</h3>
            
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
                onClick={() => setShowDocRequestModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDocuments}
                disabled={requestedDocNames.length === 0 || !docRequestMessage}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      <ShipmentChatPanel
        shipmentId={currentShipment.id}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        userRole="broker"
        userName="Customs Broker"
      />
    </div>
  );
}