import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2'; // We still use Bar component type for mixed charts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,        // Needed for bars
  LineElement,       // Needed for lines
  PointElement,      // Needed for points on lines
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Optional: For labels on bars/points

// Register all necessary Chart.js components AND the datalabels plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels // Register the plugin
);

function ParkingChart({ years, demand, supply }) {
  // console.log("ParkingChart received props:", { years, demand, supply }); // Keep commented unless debugging

  const chartData = useMemo(() => {
     if (!years || !demand || !supply || years.length === 0) return { labels: [], datasets: [] };

      const labels = years.map(y => `Year ${y}`);

     // Prepare the data object
     const dataToReturn = {
        labels: labels,
        datasets: [
         // ============================================
         // DATASET 0: SUPPLY (Blue Bars, Shared Axis 'y')
         // ============================================
         {
            type: 'bar', // Explicitly bar type
            label: 'Parking Supply',
            data: supply.map(s => Math.round(s)), // Use supply data, rounded
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue bars
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            yAxisID: 'y', // Assign to primary (left) y-axis
            order: 2 // Draw bars behind the line
          },
         // ============================================
         // DATASET 1: DEMAND (Red Line, Shared Axis 'y')
         // ============================================
          {
            type: 'line', // Explicitly line type
            label: 'Parking Demand',
            data: demand.map(d => d.toFixed(1)), // Use demand data (keep decimals for precision)
            borderColor: 'rgba(255, 99, 132, 1)', // Red line
            backgroundColor: 'rgba(255, 99, 132, 1)', // Make points red too
            borderWidth: 3, // Make line thicker
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgba(255, 99, 132, 1)', // Red points
            fill: false, // Don't fill under the line
            tension: 0.1, // Slight curve
            yAxisID: 'y', // Assign to primary (left) y-axis
            order: 1 // Draw line on top of bars
          },
        ],
      };

      // console.log("ParkingChart calculated chartData:", dataToReturn); // Keep commented unless debugging
      return dataToReturn;

  }, [years, demand, supply]); // End useMemo

  // --- Chart Options ---
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fill container height
    interaction: {
        mode: 'index', // Show tooltips for both datasets on hover
        intersect: false,
     },
    plugins: {
      legend: {
        position: 'top', // Legend at the top
        labels: {
           boxWidth: 20, // Width of the color box in legend
           padding: 15,   // Padding between legend items
           usePointStyle: true, // Use standard boxes/lines in legend (true would use point style for line)
           // Custom label generation to show bar for supply, line for demand
           //=========================================================
           generateLabels: (chart) => {
             const datasets = chart.data.datasets;
             return datasets.map((dataset, i) => ({
               text: dataset.label,
               fillStyle: dataset.backgroundColor || dataset.borderColor, // Use appropriate color
               strokeStyle: dataset.borderColor || dataset.backgroundColor,
               lineWidth: dataset.borderWidth,
               hidden: !chart.isDatasetVisible(i),
               index: i,
               // Use rect for bars, line for lines in the legend key
               pointStyle: dataset.type === 'line' ? 'line' : 'rect',// Old logic
               // Rotation might be needed for line style depending on library version
               // rotation: dataset.type === 'line' ? 0 : undefined
             }));
           }
        }
      },
      title: {
        display: false, // Title is handled outside chart component
      },
      tooltip: {
          // Standard tooltips should be okay
          callbacks: {
             label: function(context) {
                 let label = context.dataset.label || '';
                 if (label) {
                     label += ': ';
                 }
                 if (context.parsed.y !== null) {
                     // Format demand with one decimal, supply as integer
                     const value = context.dataset.label === 'Parking Demand'
                                   ? parseFloat(context.parsed.y).toFixed(1)
                                   : Math.round(context.parsed.y).toLocaleString();
                     label += value;
                 }
                 return label;
             }
          }
      },
      datalabels: { // Configuration for chartjs-plugin-datalabels (optional)
        display: false // Keep data labels off by default, can be enabled per dataset if needed
        /* Example to show labels on top of bars:
        anchor: 'end',
        align: 'top',
        formatter: (value, context) => {
            // Only show labels for the 'Parking Supply' dataset (bars)
            if (context.dataset.label === 'Parking Supply') {
                return value.toLocaleString();
            }
            return null; // Hide labels for other datasets
        },
        color: '#444'
        */
      }
    },
    scales: {
      x: {
          display: true,
          title: {
             display: true,
             text: 'Simulation Year'
          }
       },
      // ==========================
      // Define ONLY ONE Y-AXIS ('y')
      // ==========================
      y: {
        display: true,
        position: 'left', // Default position
        title: {
          display: true,
          text: 'Number of Spaces',
        },
         beginAtZero: true, // Ensure y-axis starts at 0
         // Suggest max based on the HIGHER of demand or supply, add padding
         suggestedMax: Math.max(...(demand.map(d => parseFloat(d))), ...(supply.map(s => s))) * 1.1,
      },
      // Remove the 'y1' axis definition entirely
      /*
      y1: { ... } // DELETE THIS WHOLE BLOCK
      */
    },
  }; // End options

  // Add a key to force re-render if data structure changes (less critical now)
  const chartKey = useMemo(() => JSON.stringify(chartData.labels), [chartData.labels]);

  return (
     <div style={{ position: 'relative', height: '300px', width: '100%' }}> {/* Ensure container has height */}
        <Bar options={options} data={chartData} key={chartKey} />
     </div>
  );
}

export default ParkingChart;