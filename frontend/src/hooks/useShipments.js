import { useState, useEffect, useRef } from 'react';
import { shipmentsStore } from '../store/shipmentsStore';
import { getMyShipments, pollShipmentStatus } from '../api/shipments';

export function useShipments() {
  const [shipments, setShipments] = useState(shipmentsStore.getAllShipments());
  const [importExportRules, setImportExportRules] = useState(shipmentsStore.getImportExportRules());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);

  // Fetch shipments from backend on mount
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Ensure no stale data from prior users before fetching
        shipmentsStore.clearShipments();
        setShipments([]);
        
        // Fetch shipments for authenticated user; backend derives user from JWT and returns list DTO
        const backendShipments = await getMyShipments();

        // Replace local store entirely with backend source-of-truth
        shipmentsStore.clearShipments();

        if (Array.isArray(backendShipments)) {
          backendShipments.forEach(s => {
            const frontendShipment = {
              id: s.id, // keep numeric DB id for internal actions
              referenceId: s.referenceId,
              title: s.title,
              mode: s.mode,
              shipmentType: s.shipmentType,
              value: s.value,
              currency: s.currency,
              aiScore: s.aiComplianceScore,
              aiApproval: s.aiApprovalStatus,
              brokerApproval: s.brokerApprovalStatus,
              status: s.status,
              token: s.preclearToken,
              createdAt: s.createdAt,
              // Provide shipper/consignee display objects used by UI
              shipper: { city: s.originCity, company: s.originCompany },
              consignee: { city: s.destinationCity, company: s.destinationCompany }
            };
            shipmentsStore.saveShipment(frontendShipment);
          });
        }

        // Update local state with latest store
        setShipments(shipmentsStore.getAllShipments());
      } catch (err) {
        console.error('Error fetching shipments from backend:', err);
        const msg = err?.response?.data?.error || err?.message || 'fetch_failed';
        setError(msg);
        // Continue with local store data
      } finally {
        setIsLoading(false);
      }
    };

    fetchShipments();

    // Subscribe to local store changes
    const unsubscribe = shipmentsStore.subscribe(() => {
      setShipments(shipmentsStore.getAllShipments());
      setImportExportRules(shipmentsStore.getImportExportRules());
    });

    return unsubscribe;
  }, []);

  // Periodically refresh the shipments list from backend to avoid stale UI
  useEffect(() => {
    let intervalId;
    const refresh = async () => {
      try {
        const backendShipments = await getMyShipments();
        shipmentsStore.clearShipments();
        if (Array.isArray(backendShipments)) {
          backendShipments.forEach(s => {
            const frontendShipment = {
              id: s.id,
              referenceId: s.referenceId,
              title: s.title,
              mode: s.mode,
              shipmentType: s.shipmentType,
              value: s.value,
              currency: s.currency,
              aiScore: s.aiComplianceScore,
              aiApproval: s.aiApprovalStatus,
              brokerApproval: s.brokerApprovalStatus,
              status: s.status,
              token: s.preclearToken,
              createdAt: s.createdAt,
              shipper: { city: s.originCity, company: s.originCompany },
              consignee: { city: s.destinationCity, company: s.destinationCompany }
            };
            shipmentsStore.saveShipment(frontendShipment);
          });
        }
        setShipments(shipmentsStore.getAllShipments());
      } catch { /* ignore transient errors */ }
    };

    intervalId = setInterval(refresh, 5000);
    return () => { if (intervalId) clearInterval(intervalId); };
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Start polling shipment status for real-time updates
  const startPollingShipment = (shipmentId, intervalMs = 3000) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      try {
        const statusUpdate = await pollShipmentStatus(shipmentId);
        
        // Update shipment with new status fields
        const shipment = shipmentsStore.getShipmentById(shipmentId);
        if (shipment) {
          shipment.status = statusUpdate.status;
          shipment.aiApproval = statusUpdate.aiApprovalStatus;
          shipment.brokerApproval = statusUpdate.brokerApprovalStatus;
          shipment.token = statusUpdate.preclearToken;
          shipment.aiScore = statusUpdate.aiComplianceScore;
          shipmentsStore.saveShipment(shipment);
        }
      } catch (err) {
        console.warn(`Failed to poll shipment ${shipmentId}:`, err.message);
      }
    };

    // Poll immediately and then every intervalMs
    poll();
    pollIntervalRef.current = setInterval(poll, intervalMs);
  };

  // Stop polling
  const stopPollingShipment = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  return {
    shipments,
    importExportRules,
    isLoading,
    error,
    // Polling
    startPollingShipment,
    stopPollingShipment,
    // Shipment operations
    getShipmentById: (id) => shipmentsStore.getShipmentById(id),
    saveShipment: (shipment) => shipmentsStore.saveShipment(shipment),
    updateShipmentStatus: (id, status) => shipmentsStore.updateShipmentStatus(id, status),
    updateAIApproval: (id, approval, aiResults, score) => 
      shipmentsStore.updateAIApproval(id, approval, aiResults, score),
    requestBrokerApproval: (id) => shipmentsStore.requestBrokerApproval(id),
    brokerApprove: (id, notes) => shipmentsStore.brokerApprove(id, notes),
    brokerDeny: (id, reason) => shipmentsStore.brokerDeny(id, reason),
    brokerRequestDocuments: (id, docs, message) => 
      shipmentsStore.brokerRequestDocuments(id, docs, message),
    uploadDocument: (shipmentId, docName, docType) => 
      shipmentsStore.uploadDocument(shipmentId, docName, docType),
    bookShipment: (id, bookingDate, estimatedDelivery, amount) => 
      shipmentsStore.bookShipment(id, bookingDate, estimatedDelivery, amount),
    completePayment: (id) => shipmentsStore.completePayment(id),
    // Rules operations
    addImportExportRule: (rule) => shipmentsStore.addImportExportRule(rule),
    updateImportExportRule: (id, rule) => shipmentsStore.updateImportExportRule(id, rule),
    deleteImportExportRule: (id) => shipmentsStore.deleteImportExportRule(id),
  };
}

export function useShipment(id) {
  const [shipment, setShipment] = useState(
    id ? shipmentsStore.getShipmentById(id) : undefined
  );

  useEffect(() => {
    const unsubscribe = shipmentsStore.subscribe(() => {
      if (id) {
        setShipment(shipmentsStore.getShipmentById(id));
      }
    });

    return unsubscribe;
  }, [id]);

  return shipment;
}

export function useMessages(shipmentId) {
  const [messages, setMessages] = useState(
    shipmentsStore.getMessages(shipmentId)
  );

  useEffect(() => {
    const unsubscribe = shipmentsStore.subscribe(() => {
      setMessages(shipmentsStore.getMessages(shipmentId));
    });

    return unsubscribe;
  }, [shipmentId]);

  return messages;
}

export function useNotifications(role) {
  const [notifications, setNotifications] = useState(
    shipmentsStore.getNotifications(role)
  );

  useEffect(() => {
    const unsubscribe = shipmentsStore.subscribe(() => {
      setNotifications(shipmentsStore.getNotifications(role));
    });

    return unsubscribe;
  }, [role]);

  return {
    notifications,
    addNotification: (notification) => shipmentsStore.addNotification(notification)
  };
}

