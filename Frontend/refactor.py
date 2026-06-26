import os
def r(d):
    for f in os.listdir(d):
        p=os.path.join(d,f)
        if os.path.isdir(p): r(p)
        elif p.endswith('.jsx') or p.endswith('.js'):
            with open(p,'r') as x: c=x.read()
            c=c.replace("'Syne',sans-serif", "'Inter',sans-serif")
            c=c.replace("'DM Sans',sans-serif", "'Inter',sans-serif")
            c=c.replace("rgba(0,184,141,0.08)", "rgba(37,99,235,0.08)")
            c=c.replace("rgba(0,184,141,0.04)", "rgba(37,99,235,0.04)")
            c=c.replace('stopColor="#00b88d"', 'stopColor="#2563eb"')
            c=c.replace('stopColor="#006654"', 'stopColor="#1e3a8a"')
            c=c.replace('linear-gradient(135deg,#00b88d,#6c63ff)', 'linear-gradient(135deg,#2563eb,#334155)')
            with open(p,'w') as x: x.write(c)
r('src')
print('done')
