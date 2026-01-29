import { useEffect, useState } from 'react';
import { useDateFilter } from '../../contexts/DateFilterContext';
import { logisticsService } from '../../services/logistics.service';
import MetricCard from '../dashboard/MetricCard';
import { Truck, Package, CheckCircle } from 'lucide-react';

const LogisticsModule = () => {
  const { dateRange } = useDateFilter();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState({
    due: 0,
    received: 0,
    spare: 0
  });
  const [deliveries, setDeliveries] = useState({
    cycleDelivered: 0,
    pickupPending: 0,
    pickupCleared: 0,
    outsideDelivery: 0
  });

  useEffect(() => {
    fetchLogisticsData();
  }, [dateRange]);

  const fetchLogisticsData = async () => {
    setLoading(true);
    try {
      const [shipmentData, deliveryData] = await Promise.all([
        logisticsService.getShipmentSummary(dateRange.startDate, dateRange.endDate),
        logisticsService.getDeliverySummary(dateRange.startDate, dateRange.endDate)
      ]);

      setShipments(shipmentData.data);
      setDeliveries(deliveryData.data);
    } catch (error) {
      console.error('Error fetching logistics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="logistics" className="mb-8">
        <h2 className="text-2xl font-bold mb-4">2XG Logistics</h2>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="logistics" className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">2XG Logistics</h2>

      {/* Shipment Module */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Shipment Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Shipment Due"
            value={shipments.due}
            icon={Package}
            colorClass="gray"
          />
          <MetricCard
            title="Total Shipment Received"
            value={shipments.received}
            icon={CheckCircle}
            colorClass="green"
          />
          <MetricCard
            title="Total Spare Shipment Received"
            value={shipments.spare}
            icon={Truck}
            colorClass="blue"
          />
        </div>
      </div>

      {/* Delivery Module */}
      <div>
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Delivery Status</h3>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <ul className="space-y-3">
            <li className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold text-sm">5</span>
                <span className="font-medium text-gray-700">Total Cycle Delivered</span>
              </span>
              <span className="text-2xl font-bold text-green-600">{deliveries.cycleDelivered}</span>
            </li>
            <li className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="flex items-center gap-3">
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-bold text-sm">6</span>
                <span className="font-medium text-gray-700">Total Pickup Pending</span>
              </span>
              <span className="text-2xl font-bold text-orange-600">{deliveries.pickupPending}</span>
            </li>
            <li className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="flex items-center gap-3">
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold text-sm">7</span>
                <span className="font-medium text-gray-700">Total Pickup Cleared</span>
              </span>
              <span className="text-2xl font-bold text-green-600">{deliveries.pickupCleared}</span>
            </li>
            <li className="flex items-center justify-between py-3">
              <span className="flex items-center gap-3">
                <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-bold text-sm">8</span>
                <span className="font-medium text-gray-700">Total Outside Delivery</span>
              </span>
              <span className="text-2xl font-bold text-purple-600">{deliveries.outsideDelivery}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default LogisticsModule;
