const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fonts
      content = content.replace(/'Syne',\s*sans-serif/gi, "'Inter',sans-serif");
      content = content.replace(/'DM Sans',\s*sans-serif/gi, "'Inter',sans-serif");
      
      // Professional Colors (removing hardcoded teal/purple for variables where possible, or new hex)
      // Old Teal: #00b88d -> 0,184,141
      content = content.replace(/rgba\(0,184,141,0\.08\)/g, "rgba(37,99,235,0.08)");
      content = content.replace(/rgba\(0,184,141,0\.04\)/g, "rgba(37,99,235,0.04)");
      content = content.replace(/rgba\(0,184,141,0\.05\)/g, "rgba(37,99,235,0.05)");
      content = content.replace(/rgba\(0,184,141,0\.12\)/g, "rgba(37,99,235,0.12)");
      content = content.replace(/rgba\(0,184,141,0\.1\)/g, "rgba(37,99,235,0.1)");
      
      // Gradients (Teal to Purple -> Blue to Slate)
      content = content.replace(/linear-gradient\(135deg,#00b88d,#6c63ff\)/g, "linear-gradient(135deg,#2563eb,#334155)");
      content = content.replace(/linear-gradient\(135deg,rgba\(0,184,141,0\.06\),rgba\(108,99,255,0\.06\)\)/g, "linear-gradient(135deg,rgba(37,99,235,0.06),rgba(51,65,85,0.06))");
      
      // Border radius and padding tweaks
      // We already did SharedUI, let's just make sure others are clean
      // Dashboard gradients
      content = content.replace(/<stop offset="0%" stopColor="#00b88d"\/>/g, '<stop offset="0%" stopColor="#2563eb"/>');
      content = content.replace(/<stop offset="100%" stopColor="#006654"\/>/g, '<stop offset="100%" stopColor="#1e3a8a"/>');
      
      // Header in App.jsx pulse
      if (fullPath.includes('App.jsx')) {
         content = content.replace(/fontSize:18,color:C.text/g, 'fontSize:20,color:C.text'); 
         content = content.replace(/padding:"0 28px",height:64/g, 'padding:"0 32px",height:68');
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
console.log("Refactor Complete");
