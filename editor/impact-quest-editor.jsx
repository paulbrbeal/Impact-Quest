import { useState, useCallback, useRef } from "react";

/* ─── DEFAULT DATA (simplified starter) ─── */
const DEFAULT_DATA = {
  start: {
    title: "The Impact Quest",
    narrative: "You're Dr. Alex Chen, a researcher at a UK university. Your team has just published a groundbreaking study on how community-led urban green spaces reduce anxiety and improve social cohesion in deprived neighbourhoods.\n\nThe clock is ticking toward REF 2029. What you do next will determine whether this research changes lives — or gathers dust.",
    choices: [
      { text: "Meet with the Impact Officer to develop a strategy", next: "meet_officer" },
      { text: "Go straight to Twitter/X and start promoting the paper", next: "social_media_first" },
      { text: "Contact the local council directly", next: "cold_call_council" }
    ]
  },
  meet_officer: {
    title: "Strategic Thinking",
    narrative: "Smart move. The Impact Officer, Sam, helps you map out a Theory of Change.\n\nSam asks: \"Which pathway do you want to prioritise first?\"",
    choices: [
      { text: "Policy influence — let's aim high", next: "policy_route" },
      { text: "Practitioner change — work with community orgs", next: "practitioner_route" }
    ],
    scoreEffect: { strategy: 10, evidence: 5 }
  },
  social_media_first: {
    title: "Going Viral (Sort Of)",
    narrative: "You write a Twitter thread. It gets 200 likes. A regional paper writes: \"University boffins discover parks are good for you.\"",
    choices: [{ text: "Time to get strategic", next: "meet_officer" }],
    scoreEffect: { reach: 10, significance: -5 }
  },
  cold_call_council: {
    title: "The Cold Shoulder",
    narrative: "You email the council. Three weeks later: \"Thanks, we'll keep it on file.\"",
    choices: [
      { text: "Attend policy engagement training", next: "meet_officer" },
      { text: "Focus on community organisations", next: "practitioner_route" }
    ],
    scoreEffect: { strategy: -5, stakeholders: -5 }
  },
  policy_route: {
    title: "The Policy Pathway",
    narrative: "You craft a policy brief. The council is refreshing its Health & Wellbeing Strategy.\n\nCongratulations! You've built a strong policy-focused impact case study.",
    choices: [],
    scoreEffect: { strategy: 10, stakeholders: 5 },
    isEnding: true,
    endingType: "policy"
  },
  practitioner_route: {
    title: "Working With Communities",
    narrative: "You connect with community organisations. One deep partnership beats three shallow ones.\n\nCongratulations! You've built a practice-based impact case study.",
    choices: [],
    scoreEffect: { stakeholders: 10, strategy: 5 },
    isEnding: true,
    endingType: "practitioner"
  }
};

const SCORE_KEYS = ["strategy", "stakeholders", "significance", "reach", "evidence"];
const SCORE_COLORS = { strategy: "#E8A838", stakeholders: "#4ECDC4", significance: "#FF6B6B", reach: "#45B7D1", evidence: "#96CEB4" };
const ENDING_TYPES = ["none", "policy", "practitioner", "cycle"];
const uid = () => "node_" + Math.random().toString(36).slice(2, 8);

export default function Editor() {
  const [nodes, setNodes] = useState(DEFAULT_DATA);
  const [selected, setSelected] = useState("start");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [showExport, setShowExport] = useState(null); // null | "json" | "html"
  const [exportText, setExportText] = useState("");
  const [tab, setTab] = useState("content"); // content | scores | preview
  const fileRef = useRef(null);

  const node = selected ? nodes[selected] : null;
  const nodeList = Object.entries(nodes);
  const filtered = search
    ? nodeList.filter(([id, n]) => n.title.toLowerCase().includes(search.toLowerCase()) || id.includes(search.toLowerCase()))
    : nodeList;

  const flash = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); }, []);

  // ── Node operations ──
  const update = useCallback((id, changes) => {
    setNodes(prev => ({ ...prev, [id]: { ...prev[id], ...changes } }));
  }, []);

  const addNode = useCallback(() => {
    const id = uid();
    setNodes(prev => ({ ...prev, [id]: { title: "New Scene", narrative: "", choices: [], scoreEffect: {} } }));
    setSelected(id);
    setSearch("");
    flash("Scene added");
  }, [flash]);

  const deleteNode = useCallback((id) => {
    if (id === "start") { flash("Can't delete the start node"); return; }
    setNodes(prev => {
      const next = { ...prev };
      delete next[id];
      Object.values(next).forEach(n => {
        if (n.choices) n.choices = n.choices.map(c => c.next === id ? { ...c, next: "" } : c);
      });
      return next;
    });
    setSelected("start");
    flash("Scene deleted");
  }, [flash]);

  const dupNode = useCallback((id) => {
    const src = nodes[id];
    const nid = uid();
    setNodes(prev => ({ ...prev, [nid]: { ...src, title: src.title + " (copy)", choices: (src.choices || []).map(c => ({ ...c })), scoreEffect: { ...(src.scoreEffect || {}) } } }));
    setSelected(nid);
    flash("Duplicated");
  }, [nodes, flash]);

  // ── Choice operations ──
  const addChoice = () => update(selected, { choices: [...(node.choices || []), { text: "New choice", next: "" }] });
  const updateChoice = (i, changes) => {
    const choices = [...node.choices];
    choices[i] = { ...choices[i], ...changes };
    update(selected, { choices });
  };
  const removeChoice = (i) => update(selected, { choices: node.choices.filter((_, idx) => idx !== i) });
  const moveChoice = (i, dir) => {
    const choices = [...node.choices];
    const j = i + dir;
    if (j < 0 || j >= choices.length) return;
    [choices[i], choices[j]] = [choices[j], choices[i]];
    update(selected, { choices });
  };

  // ── Import / Export ──
  const buildClean = () => {
    const clean = {};
    Object.entries(nodes).forEach(([id, n]) => {
      clean[id] = { title: n.title, narrative: n.narrative, choices: (n.choices || []).filter(c => c.text) };
      if (n.image) { clean[id].image = n.image; clean[id].imageSize = n.imageSize || "large"; }
      if (n.scoreEffect && Object.keys(n.scoreEffect).length) clean[id].scoreEffect = n.scoreEffect;
      if (n.isEnding) { clean[id].isEnding = true; clean[id].endingType = n.endingType || "policy"; }
    });
    return clean;
  };

  const buildFullHTML = (gameDataStr) => {
    const SC = "<" + "/script>";
    const parts = [];
    parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Impact Quest</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0F1419;--surface:#1A2332;--surface-hover:#243447;--border:#2A3A4E;--text-primary:#E8ECF0;--text-secondary:#8899AA;--text-muted:#556677;--bar-bg:#1E2D3D;--accent:#4ECDC4;--accent-glow:rgba(78,205,196,0.15)}
body{background:var(--bg);color:var(--text-primary);font-family:'DM Sans',sans-serif;min-height:100vh;padding:20px}
.container{max-width:720px;margin:0 auto}
.header{text-align:center;margin-bottom:32px;padding-top:20px}
.header-label{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:var(--accent);margin-bottom:8px;font-weight:600}
.header h1{font-family:'Playfair Display',serif;font-size:42px;font-weight:800;background:linear-gradient(135deg,#4ECDC4,#45B7D1,#E8A838);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.header-meta{font-size:12px;color:var(--text-muted);margin-top:8px}
.dashboard{background:var(--surface);border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid var(--border)}
.dashboard-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.dashboard-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:var(--text-secondary)}
.dashboard-total{font-size:13px;font-weight:700;color:var(--accent);background:var(--accent-glow);padding:4px 12px;border-radius:20px}
.score-row{margin-bottom:10px}
.score-label{display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;color:var(--text-secondary)}
.score-label .val{font-weight:600}
.score-track{height:8px;border-radius:4px;background:var(--bar-bg);overflow:hidden}
.score-fill{height:100%;border-radius:4px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1)}
.content-card{background:var(--surface);border-radius:12px;padding:28px 24px;margin-bottom:24px;border:1px solid var(--border);position:relative;overflow:hidden;opacity:0;animation:fadeIn 0.4s ease forwards}
.content-card.ending{border-width:2px}
.content-card .top-line{position:absolute;top:0;left:0;right:0;height:3px}
.content-title-row{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.content-title-row .emoji{font-size:28px}
.content-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700}
.content-title.ending{font-size:26px}
.narrative{font-size:15px;line-height:1.75;color:var(--text-secondary)}
.narrative p{margin-bottom:12px}
.skip-hint{font-size:11px;color:var(--text-muted);font-style:italic;margin-top:8px;cursor:pointer}
.choices-section{display:flex;flex-direction:column;gap:10px;margin-bottom:32px}
.choices-label{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:4px}
.choice-btn{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 20px;cursor:pointer;text-align:left;color:var(--text-primary);font-size:14px;font-family:'DM Sans',sans-serif;line-height:1.5;transition:all 0.2s ease;display:flex;align-items:center;gap:14px}
.choice-btn:hover{background:var(--surface-hover);border-color:var(--accent)}
.choice-letter{min-width:28px;height:28px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--text-secondary);transition:all 0.2s ease;flex-shrink:0}
.choice-btn:hover .choice-letter{background:var(--accent);color:#0F1419}
.ending-box{background:var(--surface);border-radius:12px;padding:24px;border:1px solid var(--border);text-align:center;margin-bottom:32px}
.ending-score-label{font-size:14px;color:var(--text-secondary);margin-bottom:16px}
.ending-score-val{font-size:32px;font-weight:800;color:var(--accent);font-family:'Playfair Display',serif}
.ending-summary{font-size:13px;color:var(--text-muted);margin-bottom:20px}
.restart-btn{background:var(--accent);border:none;border-radius:8px;padding:12px 32px;cursor:pointer;color:#0F1419;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;transition:transform 0.2s ease}
.restart-btn:hover{transform:scale(1.05)}
.journey-log{margin-bottom:32px}
.journey-log summary{cursor:pointer;font-size:12px;color:var(--text-muted);letter-spacing:2px;text-transform:uppercase;font-weight:600;padding:8px 0}
.journey-step{padding:8px 16px;margin-bottom:8px;font-size:13px;color:var(--text-secondary);border-left:2px solid var(--border)}
.journey-step .step-title{font-weight:600;color:var(--text-primary);margin-bottom:2px}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
</style>
</head>
<body>
<div id="app"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js">`);
    parts.push(SC);
    parts.push(`
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js">`);
    parts.push(SC);
    parts.push(`
<script>
var e=React.createElement,useState=React.useState,useEffect=React.useEffect,useRef=React.useRef,useCallback=React.useCallback;
var GAME_DATA = `);
    parts.push(gameDataStr);
    parts.push(`;
var SCORE_LABELS={strategy:"Strategic Thinking",stakeholders:"Stakeholder Relations",significance:"Significance",reach:"Reach",evidence:"Evidence Quality"};
var SCORE_COLORS={strategy:"#E8A838",stakeholders:"#4ECDC4",significance:"#FF6B6B",reach:"#45B7D1",evidence:"#96CEB4"};
var ENDING_THEMES={policy:{emoji:"\ud83c\udfdb\ufe0f",color:"#45B7D1"},practitioner:{emoji:"\ud83e\udd1d",color:"#4ECDC4"},cycle:{emoji:"\ud83d\udd04",color:"#E8A838"}};

function TypewriterText(props){
  var text=props.text,speed=props.speed,onComplete=props.onComplete;
  var _d=useState(""),displayed=_d[0],setDisplayed=_d[1];
  var _dn=useState(false),done=_dn[0],setDone=_dn[1];
  var idx=useRef(0),timer=useRef(null);
  useEffect(function(){
    idx.current=0;setDisplayed("");setDone(false);
    function tick(){idx.current++;setDisplayed(text.slice(0,idx.current));if(idx.current>=text.length){setDone(true);if(onComplete)onComplete();}else{timer.current=setTimeout(tick,speed||8);}}
    timer.current=setTimeout(tick,speed||8);
    return function(){clearTimeout(timer.current);};
  },[text]);
  var handleSkip=function(){clearTimeout(timer.current);setDisplayed(text);setDone(true);if(onComplete)onComplete();};
  var pars=displayed.split("\\n").map(function(line,i){return e("p",{key:i,style:{margin:"0 0 12px 0",minHeight:line===""?12:"auto"}},line);});
  return e("div",{onClick:!done?handleSkip:undefined,style:{cursor:done?"default":"pointer"}},pars,!done?e("div",{className:"skip-hint"},"Click to skip animation"):null);
}

function ScoreBar(props){
  var pct=Math.min((props.value/props.max)*100,100);
  return e("div",{className:"score-row"},e("div",{className:"score-label"},e("span",null,props.label),e("span",{className:"val",style:{color:props.color}},props.value)),e("div",{className:"score-track"},e("div",{className:"score-fill",style:{width:pct+"%",background:props.color}})));
}

function App(){
  var _cn=useState("start"),currentNode=_cn[0],setCurrentNode=_cn[1];
  var _sc=useState({strategy:0,stakeholders:0,significance:0,reach:0,evidence:0}),scores=_sc[0],setScores=_sc[1];
  var _hi=useState([]),history=_hi[0],setHistory=_hi[1];
  var _sh=useState(false),showChoices=_sh[0],setShowChoices=_sh[1];
  var _ck=useState(0),cardKey=_ck[0],setCardKey=_ck[1];
  var node=GAME_DATA[currentNode];
  var maxScore=Math.max(50,Math.max.apply(null,Object.values(scores)));
  var totalScore=Object.values(scores).reduce(function(a,b){return a+b;},0);
  var endTheme=node.isEnding?ENDING_THEMES[node.endingType]:null;

  var handleChoice=function(choice){
    setShowChoices(false);
    setHistory(function(h){return h.concat([{node:currentNode,choice:choice.text}]);});
    var nextNode=GAME_DATA[choice.next];
    if(nextNode&&nextNode.scoreEffect){
      setScores(function(s){var ns=Object.assign({},s);Object.keys(nextNode.scoreEffect).forEach(function(k){ns[k]=Math.max(0,(ns[k]||0)+nextNode.scoreEffect[k]);});return ns;});
    }
    setCurrentNode(choice.next);setCardKey(function(k){return k+1;});window.scrollTo({top:0,behavior:"smooth"});
  };

  var restart=function(){
    setCurrentNode("start");setScores({strategy:0,stakeholders:0,significance:0,reach:0,evidence:0});
    setHistory([]);setShowChoices(false);setCardKey(function(k){return k+1;});window.scrollTo({top:0,behavior:"smooth"});
  };

  return e("div",{className:"container"},
    e("div",{className:"header"},
      e("div",{className:"header-label"},"A Research Impact Adventure"),
      e("h1",null,"The Impact Quest"),
      currentNode!=="start"?e("div",{className:"header-meta"},"Chapter "+(history.length+1)+" \\u00b7 Decisions made: "+history.length):null
    ),
    currentNode!=="start"?e("div",{className:"dashboard"},
      e("div",{className:"dashboard-header"},e("span",{className:"dashboard-title"},"Impact Dashboard"),e("span",{className:"dashboard-total"},"Total: "+totalScore)),
      Object.keys(SCORE_LABELS).map(function(key){return e(ScoreBar,{key:key,label:SCORE_LABELS[key],value:scores[key],max:maxScore,color:SCORE_COLORS[key]});})
    ):null,
    e("div",{key:cardKey,className:"content-card"+(node.isEnding?" ending":""),style:node.isEnding?{borderColor:endTheme.color}:{}},
      node.isEnding?e("div",{className:"top-line",style:{background:"linear-gradient(90deg, "+endTheme.color+", transparent)"}}):null,
      e("div",{className:"content-title-row"},
        node.isEnding?e("span",{className:"emoji"},endTheme.emoji):null,
        e("h2",{className:"content-title"+(node.isEnding?" ending":""),style:node.isEnding?{color:endTheme.color}:{}},node.title)
      ),
      node.image?e("div",{style:{textAlign:"center",marginBottom:"16px"}},e("img",{src:node.image,alt:"",style:{width:node.imageSize==="small"?"40%":node.imageSize==="medium"?"65%":"100%",maxHeight:node.imageSize==="banner"?"150px":"300px",objectFit:"cover",borderRadius:"8px"}})):null,
      e("div",{className:"narrative"},e(TypewriterText,{key:currentNode,text:node.narrative,speed:8,onComplete:function(){setShowChoices(true);}}))
    ),
    !node.isEnding&&showChoices&&node.choices?e("div",{className:"choices-section"},
      e("div",{className:"choices-label"},"What do you do?"),
      node.choices.map(function(choice,i){return e("button",{key:i,className:"choice-btn",onClick:function(){handleChoice(choice);}},e("span",{className:"choice-letter"},String.fromCharCode(65+i)),choice.text);})
    ):null,
    node.isEnding&&showChoices?e("div",{className:"ending-box"},
      e("div",{className:"ending-score-label"},"Final Score: ",e("span",{className:"ending-score-val"},totalScore)),
      e("div",{className:"ending-summary"},"You made "+history.length+" decisions."+(totalScore>=80?" Outstanding!":totalScore>=50?" Strong foundations.":" Try different choices next time!")),
      e("button",{className:"restart-btn",onClick:restart},"Play Again")
    ):null,
    history.length>0&&showChoices?e("details",{className:"journey-log"},
      e("summary",null,"Your Journey ("+history.length+" steps)"),
      e("div",{style:{marginTop:12}},history.map(function(h,i){return e("div",{key:i,className:"journey-step",style:{borderLeftColor:SCORE_COLORS[Object.keys(SCORE_COLORS)[i%5]]}},e("div",{className:"step-title"},GAME_DATA[h.node]?GAME_DATA[h.node].title:""),"\\u2192 "+h.choice);}))
    ):null
  );
}
ReactDOM.render(e(App),document.getElementById("app"));
`);
    parts.push(SC);
    parts.push(`
</body>
</html>`);
    return parts.join("");
  };

  const exportJSON = () => {
    const clean = buildClean();
    setExportText(JSON.stringify(clean, null, 2));
    setShowExport("json");
  };

  const copyForHTML = () => {
    const clean = buildClean();
    const gameDataStr = JSON.stringify(clean, null, 2);
    const fullHTML = buildFullHTML(gameDataStr);
    setExportText(fullHTML);
    setShowExport("html");
  };

  const importJSON = () => {
    try {
      const data = JSON.parse(importText);
      setNodes(data);
      setSelected(Object.keys(data)[0] || "start");
      setShowImport(false);
      setImportText("");
      flash(Object.keys(data).length + " scenes imported");
    } catch { flash("Invalid JSON"); }
  };

  const importFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setNodes(data);
        setSelected(Object.keys(data)[0] || "start");
        flash(Object.keys(data).length + " scenes imported from file");
      } catch { flash("Invalid JSON file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };



  // ── Inbound links (what leads here) ──
  const inbound = selected ? nodeList.filter(([id, n]) => (n.choices || []).some(c => c.next === selected)).map(([id]) => id) : [];

  // ── Preview trace ──
  const getTrace = (startId, maxDepth = 8) => {
    const trace = [];
    let current = startId;
    const visited = new Set();
    while (current && nodes[current] && !visited.has(current) && trace.length < maxDepth) {
      visited.add(current);
      const n = nodes[current];
      trace.push({ id: current, title: n.title, isEnding: n.isEnding });
      const firstChoice = (n.choices || [])[0];
      current = firstChoice ? firstChoice.next : null;
    }
    return trace;
  };

  // ── Styles ──
  const s = {
    inp: { width: "100%", background: "#1A1F2B", border: "1px solid #2D333B", color: "#D0D7DE", padding: "8px 10px", borderRadius: 6, fontSize: 13, fontFamily: "inherit", marginBottom: 12, outline: "none", boxSizing: "border-box" },
    sel: { width: "100%", background: "#1A1F2B", border: "1px solid #2D333B", color: "#D0D7DE", padding: "7px 8px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
    label: { display: "block", fontSize: 10, fontWeight: 700, color: "#7A828E", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 5 },
    btn: { background: "#272D38", border: "1px solid #2D333B", color: "#D0D7DE", padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 },
    accent: { background: "#238636", border: "1px solid #2EA043", color: "#fff", padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 },
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0E1116", color: "#D0D7DE", overflow: "hidden" }}>

      {/* ── LEFT: Scene List ── */}
      <div style={{ width: 280, borderRight: "1px solid #1C2028", display: "flex", flexDirection: "column", flexShrink: 0, background: "#12161D" }}>

        {/* Toolbar */}
        <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #1C2028" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#E6EDF3", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎮</span> Impact Quest Editor
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <button onClick={addNode} style={s.btn}>+ Scene</button>
            <button onClick={exportJSON} style={s.btn}>Export</button>
            <button onClick={() => fileRef.current.click()} style={s.btn}>Import</button>
            <button onClick={copyForHTML} style={s.accent}>Generate HTML Game</button>
            <input ref={fileRef} type="file" accept=".json" onChange={importFile} style={{ display: "none" }} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search scenes..."
            style={{ ...s.inp, marginBottom: 0, fontSize: 12, padding: "6px 10px" }}
          />
        </div>

        {/* Scene list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {filtered.map(([id, n]) => {
            const isSel = id === selected;
            const isEnd = n.isEnding;
            const choiceCount = (n.choices || []).length;
            const hasOrphan = (n.choices || []).some(c => c.next && !nodes[c.next]);
            return (
              <div
                key={id}
                onClick={() => { setSelected(id); setTab("content"); }}
                style={{
                  padding: "8px 14px",
                  cursor: "pointer",
                  background: isSel ? "#1C2638" : "transparent",
                  borderLeft: isSel ? "3px solid #4ECDC4" : "3px solid transparent",
                  transition: "all 0.1s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {id === "start" && <span style={{ fontSize: 8, background: "#4ECDC4", color: "#0E1116", padding: "1px 5px", borderRadius: 3, fontWeight: 800 }}>START</span>}
                  {isEnd && <span style={{ fontSize: 8, background: "#E8A838", color: "#0E1116", padding: "1px 5px", borderRadius: 3, fontWeight: 800 }}>END</span>}
                  {hasOrphan && <span style={{ fontSize: 8, background: "#FF6B6B", color: "#fff", padding: "1px 5px", borderRadius: 3, fontWeight: 800 }}>FIX</span>}
                  {n.image && <span style={{ fontSize: 8, background: "#58A6FF", color: "#fff", padding: "1px 5px", borderRadius: 3, fontWeight: 800 }}>IMG</span>}
                  <span style={{ fontSize: 13, fontWeight: 600, color: isSel ? "#E6EDF3" : "#ADBAC7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{n.title}</span>
                </div>
                <div style={{ fontSize: 10, color: "#545D68", marginTop: 2, display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: "monospace" }}>{id}</span>
                  {choiceCount > 0 && <span>{choiceCount} choice{choiceCount > 1 ? "s" : ""}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "8px 14px", borderTop: "1px solid #1C2028", fontSize: 11, color: "#545D68" }}>
          {nodeList.length} scenes · {nodeList.filter(([_, n]) => n.isEnding).length} endings
        </div>
      </div>

      {/* ── RIGHT: Editor ── */}
      <div style={{ flex: 1, overflowY: "auto", background: "#0E1116" }}>
        {node ? (
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 28px" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#E6EDF3", margin: 0 }}>{node.title}</h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => dupNode(selected)} style={s.btn} title="Duplicate">Duplicate</button>
                {selected !== "start" && <button onClick={() => deleteNode(selected)} style={{ ...s.btn, color: "#FF6B6B", borderColor: "#FF6B6B44" }}>Delete</button>}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #1C2028" }}>
              {[["content", "Content"], ["scores", "Scores & Settings"], ["preview", "Flow Preview"]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    background: "none", border: "none", borderBottom: tab === key ? "2px solid #4ECDC4" : "2px solid transparent",
                    color: tab === key ? "#E6EDF3" : "#7A828E", padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >{label}</button>
              ))}
            </div>

            {/* ── Content Tab ── */}
            {tab === "content" && (
              <>
                <label style={s.label}>Scene Title</label>
                <input value={node.title} onChange={e => update(selected, { title: e.target.value })} style={s.inp} />

                {/* Scene Image */}
                <label style={s.label}>Scene Image (optional)</label>
                <input
                  value={node.image || ""}
                  onChange={e => update(selected, { image: e.target.value })}
                  placeholder="Paste an image URL (e.g. https://example.com/photo.jpg)"
                  style={s.inp}
                />
                {node.image && (
                  <div style={{ marginBottom: 14 }}>
                    {/* Size selector */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {[
                        { key: "small", label: "Small", w: "40%" },
                        { key: "medium", label: "Medium", w: "65%" },
                        { key: "large", label: "Large", w: "100%" },
                        { key: "banner", label: "Banner", w: "100%" },
                      ].map(opt => {
                        const current = node.imageSize || "large";
                        const active = current === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => update(selected, { imageSize: opt.key })}
                            style={{
                              ...s.btn,
                              padding: "4px 10px",
                              fontSize: 11,
                              background: active ? "#4ECDC4" : "#272D38",
                              color: active ? "#0E1116" : "#D0D7DE",
                              borderColor: active ? "#4ECDC4" : "#2D333B",
                            }}
                          >{opt.label}</button>
                        );
                      })}
                    </div>
                    {/* Preview */}
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #1C2028" }}>
                      <div style={{ display: "flex", justifyContent: node.imageSize === "small" || node.imageSize === "medium" ? "center" : "stretch", background: "#0D1117", padding: (node.imageSize === "small" || node.imageSize === "medium") ? 12 : 0 }}>
                        <img
                          src={node.image}
                          alt="Scene image"
                          style={{
                            width: node.imageSize === "small" ? "40%" : node.imageSize === "medium" ? "65%" : "100%",
                            maxHeight: node.imageSize === "banner" ? 120 : 200,
                            objectFit: "cover",
                            display: "block",
                            borderRadius: (node.imageSize === "small" || node.imageSize === "medium") ? 6 : 0,
                          }}
                          onError={e => { e.target.style.display = "none"; }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#151A24" }}>
                        <span style={{ fontSize: 10, color: "#545D68", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                          {(node.imageSize || "large").charAt(0).toUpperCase() + (node.imageSize || "large").slice(1)} · {node.image.length > 40 ? node.image.slice(0, 40) + "…" : node.image}
                        </span>
                        <button onClick={() => update(selected, { image: "", imageSize: undefined })} style={{ background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", fontSize: 11, padding: "2px 6px", fontFamily: "inherit" }}>Remove</button>
                      </div>
                    </div>
                  </div>
                )}

                <label style={s.label}>Narrative</label>
                <textarea
                  value={node.narrative}
                  onChange={e => update(selected, { narrative: e.target.value })}
                  style={{ ...s.inp, minHeight: 200, resize: "vertical", lineHeight: 1.7 }}
                />

                {/* Choices */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 8 }}>
                  <label style={{ ...s.label, marginBottom: 0 }}>Choices ({(node.choices || []).length})</label>
                  <button onClick={addChoice} style={s.btn}>+ Add Choice</button>
                </div>

                {(node.choices || []).map((c, i) => (
                  <div key={i} style={{ background: "#151A24", borderRadius: 8, padding: 14, marginBottom: 10, border: "1px solid #1C2028" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#58A6FF" }}>Choice {String.fromCharCode(65 + i)}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => moveChoice(i, -1)} disabled={i === 0} style={{ ...s.btn, padding: "2px 8px", fontSize: 11, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                        <button onClick={() => moveChoice(i, 1)} disabled={i === node.choices.length - 1} style={{ ...s.btn, padding: "2px 8px", fontSize: 11, opacity: i === node.choices.length - 1 ? 0.3 : 1 }}>↓</button>
                        <button onClick={() => removeChoice(i)} style={{ ...s.btn, padding: "2px 8px", fontSize: 11, color: "#FF6B6B" }}>✕</button>
                      </div>
                    </div>
                    <input value={c.text} onChange={e => updateChoice(i, { text: e.target.value })} placeholder="What the player sees..." style={{ ...s.inp, marginBottom: 8 }} />
                    <label style={{ ...s.label, fontSize: 9 }}>Links to</label>
                    <select value={c.next || ""} onChange={e => updateChoice(i, { next: e.target.value })} style={s.sel}>
                      <option value="">— Select target scene —</option>
                      {nodeList.filter(([nid]) => nid !== selected).map(([nid, nn]) => (
                        <option key={nid} value={nid}>{nn.title} ({nid})</option>
                      ))}
                    </select>
                    {c.next && nodes[c.next] && (
                      <button onClick={() => { setSelected(c.next); setTab("content"); }} style={{ marginTop: 6, background: "none", border: "none", color: "#4ECDC4", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                        → Go to: {nodes[c.next].title}
                      </button>
                    )}
                  </div>
                ))}

                {/* Inbound links */}
                {inbound.length > 0 && (
                  <div style={{ marginTop: 16, padding: 12, background: "#151A24", borderRadius: 8, border: "1px solid #1C2028" }}>
                    <label style={{ ...s.label, marginBottom: 8 }}>Scenes that link here ({inbound.length})</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {inbound.map(id => (
                        <button key={id} onClick={() => { setSelected(id); setTab("content"); }} style={{ background: "#1C2638", border: "1px solid #2D333B", color: "#58A6FF", padding: "4px 10px", borderRadius: 5, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                          ← {nodes[id]?.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Scores Tab ── */}
            {tab === "scores" && (
              <>
                <label style={s.label}>Ending Scene?</label>
                <select
                  value={node.isEnding ? (node.endingType || "policy") : "none"}
                  onChange={e => {
                    if (e.target.value === "none") update(selected, { isEnding: false, endingType: undefined });
                    else update(selected, { isEnding: true, endingType: e.target.value });
                  }}
                  style={{ ...s.sel, marginBottom: 16 }}
                >
                  {ENDING_TYPES.map(t => <option key={t} value={t}>{t === "none" ? "Not an ending" : t.charAt(0).toUpperCase() + t.slice(1) + " ending"}</option>)}
                </select>

                <label style={s.label}>Score Effects</label>
                <p style={{ fontSize: 11, color: "#545D68", marginBottom: 12, marginTop: 0 }}>Points added (or subtracted) when the player reaches this scene.</p>
                <div style={{ background: "#151A24", borderRadius: 8, padding: 16, border: "1px solid #1C2028" }}>
                  {SCORE_KEYS.map(k => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: SCORE_COLORS[k], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: SCORE_COLORS[k], width: 110, fontWeight: 600 }}>{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                      <input
                        type="range" min={-30} max={30} step={5}
                        value={(node.scoreEffect && node.scoreEffect[k]) || 0}
                        onChange={e => {
                          const v = parseInt(e.target.value) || 0;
                          const se = { ...(node.scoreEffect || {}) };
                          if (v === 0) delete se[k]; else se[k] = v;
                          update(selected, { scoreEffect: se });
                        }}
                        style={{ flex: 1, accentColor: SCORE_COLORS[k] }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 700, color: SCORE_COLORS[k], width: 36, textAlign: "right", fontFamily: "monospace" }}>
                        {((node.scoreEffect && node.scoreEffect[k]) || 0) > 0 ? "+" : ""}{(node.scoreEffect && node.scoreEffect[k]) || 0}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  <label style={s.label}>Node ID</label>
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: "#58A6FF", background: "#151A24", padding: "8px 12px", borderRadius: 6 }}>{selected}</div>
                </div>
              </>
            )}

            {/* ── Preview Tab ── */}
            {tab === "preview" && (
              <>
                <p style={{ fontSize: 12, color: "#7A828E", marginBottom: 16, marginTop: 0 }}>Shows the path from this scene following the first choice at each step. Click any scene to jump to it.</p>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  {/* Vertical line */}
                  <div style={{ position: "absolute", left: 9, top: 12, bottom: 12, width: 2, background: "#1C2028" }} />

                  {getTrace(selected, 12).map((t, i) => {
                    const n = nodes[t.id];
                    const choices = n?.choices || [];
                    return (
                      <div key={t.id + "-" + i} style={{ position: "relative", marginBottom: 4 }}>
                        {/* Dot */}
                        <div style={{
                          position: "absolute", left: -16, top: 12,
                          width: 12, height: 12, borderRadius: "50%",
                          background: i === 0 ? "#4ECDC4" : t.isEnding ? "#E8A838" : "#2D333B",
                          border: "2px solid #0E1116",
                        }} />

                        <div
                          onClick={() => { setSelected(t.id); setTab("content"); }}
                          style={{
                            background: t.id === selected ? "#1C2638" : "#151A24",
                            border: `1px solid ${t.id === selected ? "#4ECDC4" : "#1C2028"}`,
                            borderRadius: 8, padding: "10px 14px", cursor: "pointer",
                            transition: "border-color 0.15s",
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3", marginBottom: 4 }}>
                            {t.isEnding && <span style={{ color: "#E8A838", marginRight: 6 }}>🏁</span>}
                            {t.title}
                          </div>
                          <div style={{ fontSize: 11, color: "#545D68", fontFamily: "monospace" }}>{t.id}</div>
                          {choices.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {choices.map((c, ci) => (
                                <div key={ci} style={{ fontSize: 11, color: ci === 0 ? "#4ECDC4" : "#545D68", padding: "1px 0" }}>
                                  {ci === 0 ? "→ " : "  "}{c.text}{ci === 0 && " (followed)"}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "#545D68" }}>Select a scene to edit</div>
        )}
      </div>

      {/* ── Import Modal ── */}
      {showImport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }} onClick={() => setShowImport(false)}>
          <div style={{ background: "#161B22", border: "1px solid #2D333B", borderRadius: 12, padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#E6EDF3", marginBottom: 12 }}>Import JSON</h3>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste JSON here..." style={{ ...s.inp, minHeight: 200, fontFamily: "monospace", fontSize: 11 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowImport(false)} style={s.btn}>Cancel</button>
              <button onClick={importJSON} style={s.accent}>Import</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }} onClick={() => setShowExport(null)}>
          <div style={{ background: "#161B22", border: "1px solid #2D333B", borderRadius: 12, padding: 24, width: 640, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#E6EDF3", marginBottom: 4 }}>
              {showExport === "html" ? "Generate Playable HTML" : "Export JSON"}
            </h3>
            <p style={{ fontSize: 12, color: "#7A828E", marginBottom: 12, lineHeight: 1.6 }}>
              {showExport === "html"
                ? "This is a complete, standalone HTML game file. To save it: click inside the box, press Ctrl+A (select all), then Ctrl+C (copy). Open Notepad, paste it in, then File → Save As → change type to \"All Files\" → name it something.html → Save. Double-click the file to play."
                : "Select all the text below (Ctrl+A inside the box), copy it (Ctrl+C), and save it as a .json file. Or use this to import into the editor later."
              }
            </p>
            <textarea
              readOnly
              value={exportText}
              onFocus={e => e.target.select()}
              style={{ ...s.inp, flex: 1, minHeight: 300, fontFamily: "monospace", fontSize: 10, resize: "vertical", marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowExport(null)} style={s.btn}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#1C2638", border: "1px solid #4ECDC4", color: "#4ECDC4", padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 1000, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
