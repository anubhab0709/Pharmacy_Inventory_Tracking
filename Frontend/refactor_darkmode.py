import os
import re

def r(d):
    for f in os.listdir(d):
        p=os.path.join(d,f)
        if os.path.isdir(p): r(p)
        elif p.endswith('.jsx') or p.endswith('.js'):
            with open(p,'r') as x: c=x.read()
            # Remove direct rgba usage of primary 37,99,235
            c = re.sub(r'rgba\(37,99,235,([0-9\.]+)\)', r'rgba(var(--primary-rgb),\1)', c)
            # Remove linear-gradient hardcoded values
            c = c.replace('linear-gradient(135deg,#2563eb,#334155)', 'linear-gradient(135deg,var(--primary),var(--slate))')
            c = c.replace('linear-gradient(135deg,rgba(37,99,235,0.06),rgba(51,65,85,0.06))', 'linear-gradient(135deg,rgba(var(--primary-rgb),0.06),rgba(var(--slate-rgb),0.06))')
            c = c.replace('stopColor="#2563eb"', 'stopColor="var(--primary)"')
            c = c.replace('stopColor="#1e3a8a"', 'stopColor="var(--bg)"')
            # Fix App.jsx injected inline style overrides for body correctly loading var(--bg)
            if 'App.jsx' in p:
               c = c.replace('body{background:${C.bg};', 'body{background:var(--bg);')
            with open(p,'w') as x: x.write(c)

r('src')
print("refactored alphas")
