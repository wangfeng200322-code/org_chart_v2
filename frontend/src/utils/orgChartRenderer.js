import { countReports } from '../composables/useOrgChart.js';

// Custom label renderer
export function drawNameCard(context, data, settings, graph) {
  const { x, y, size, label, node } = data;
  
  // Parse the label to extract employee information
  const lines = label.split('\n');
  const [fullName, role, department, email, phone] = lines;
  
  // Count reports
  const { directReports, totalReports } = countReports(graph, node);
  
  // Card dimensions
  const cardWidth = 220;
  const cardHeight = 160;
  const cardX = x - cardWidth / 2;
  const cardY = y - cardHeight / 2;
  
  // Draw card background
  context.fillStyle = '#ffffff';
  context.strokeStyle = '#cccccc';
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(cardX, cardY, cardWidth, cardHeight, 8);
  context.fill();
  context.stroke();
  
  // Draw header section
  context.fillStyle = '#f0f8ff';
  context.beginPath();
  context.roundRect(cardX, cardY, cardWidth, 30, 8, 8, 0, 0);
  context.fill();
  
  // Draw employee name
  context.fillStyle = '#333333';
  context.font = 'bold 14px Arial';
  context.textAlign = 'left';
  context.fillText(fullName, cardX + 10, cardY + 20);
  
  // Draw role
  context.fillStyle = '#666666';
  context.font = '12px Arial';
  context.fillText(role, cardX + 10, cardY + 40);
  
  // Draw department
  context.fillText(department, cardX + 10, cardY + 55);
  
  // Draw email
  context.fillText(email, cardX + 10, cardY + 75);
  
  // Draw phone
  if (phone) {
    context.fillText(phone, cardX + 10, cardY + 90);
  }
  
  // Draw reports info
  context.fillText(`Reports: ${directReports} direct, ${totalReports} total`, cardX + 10, cardY + 110);
}