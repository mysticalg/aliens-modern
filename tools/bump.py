import re,sys,glob,os
V=sys.argv[1];root=os.path.join(os.path.dirname(__file__),'..','public')
for f in glob.glob(root+'/js/*.js'):
    s=open(f).read();n=re.sub(r"""((?:from|import)\s*\(?\s*['"])(\./[\w]+\.js)(\?v=\d+)?(['"])""",lambda m:m.group(1)+m.group(2)+'?v='+V+m.group(4),s)
    if n!=s:open(f,'w').write(n)
f=root+'/index.html';s=open(f).read();s=re.sub(r'main\.js\?v=\d+','main.js?v='+V,s);s=re.sub(r'style\.css\?v=\d+','style.css?v='+V,s);open(f,'w').write(s)
print('bumped',V)
