import { focusedNode, countReports } from '../composables/useOrgChart.js';

// Custom label renderer
export function drawNameCard(context, data, settings, graph) {
  const { x, y, size, label, node } = data;
  
  // Parse the label to extract employee information
  const lines = label.split('\n');
  const [fullName, role, department, email, phone] = lines;
  
  // Check if this is the focused node
  const isFocused = focusedNode.value === node;
  
  if (isFocused) {
    // Draw detailed card for focused node
    // Count reports
    const { directReports, totalReports } = countReports(graph, node);
    
    // Card dimensions for detailed view
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
    
    // Draw node border on focus
    context.strokeStyle = '#4285f4';
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(cardX, cardY, cardWidth, cardHeight, 8);
    context.stroke();
  } else {
    // Draw basic card for non-focused nodes
    // Card dimensions for basic view
    const cardWidth = 180;
    const cardHeight = 70;
    const cardX = x - cardWidth / 2;
    const cardY = y - cardHeight / 2;
    
    // Draw card background
    context.fillStyle = '#ffffff';
    context.strokeStyle = '#dddddd';
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(cardX, cardY, cardWidth, cardHeight, 6);
    context.fill();
    context.stroke();
    
    // Draw header section
    context.fillStyle = '#f8f9fa';
    context.beginPath();
    context.roundRect(cardX, cardY, cardWidth, 25, 6, 6, 0, 0);
    context.fill();
    
    // Draw employee name
    context.fillStyle = '#333333';
    context.font = 'bold 13px Arial';
    context.textAlign = 'left';
    context.fillText(fullName, cardX + 8, cardY + 17);
    
    // Draw role
    context.fillStyle = '#666666';
    context.font = '11px Arial';
    context.fillText(role, cardX + 8, cardY + 35);
    
    // Draw department
    context.fillText(department, cardX + 8, cardY + 50);
  }
}

// Add roundRect method to CanvasRenderingContext2D if it doesn't exist
if (CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      radius = {...{tl: 0, tr: 0, br: 0, bl: 0}, ...radius};
    }
    
    this.moveTo(x + radius.tl, y);
    this.lineTo(x + width - radius.tr, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    this.lineTo(x + width, y + height - radius.br);
    this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    this.lineTo(x + radius.bl, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    this.lineTo(x, y + radius.tl);
    this.quadraticCurveTo(x, y, x + radius.tl, y);
    return this;
  };
}