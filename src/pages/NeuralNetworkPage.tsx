import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, Users, Brain, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: 'follow' | 'engagement';
}

export default function NeuralMesh() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const followersSnap = await getDocs(collection(db, 'followers'));
      
      const nodes: Node[] = usersSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || 'Unknown',
          avatar: data.avatar || '',
          role: data.role || 'user'
        };
      });

      const links: Link[] = followersSnap.docs.map(d => {
        const data = d.data();
        return {
          source: data.followerId,
          target: data.followedId,
          type: 'follow'
        };
      });

      setLoading(false);
      drawGraph(nodes, links);
    };

    fetchData();
  }, []);

  const drawGraph = (nodes: Node[], links: Link[]) => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    const link = svg.append("g")
      .attr("stroke", "rgba(34, 211, 238, 0.1)")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(links)
      .join("line");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any)
      .on("click", (event, d) => setSelectedNode(d));

    node.append("circle")
      .attr("r", 20)
      .attr("fill", "#050505")
      .attr("stroke", d => d.id === currentUser?.uid ? "#22d3ee" : "rgba(255,255,255,0.1)")
      .attr("stroke-width", 2);

    node.append("clipPath")
      .attr("id", d => `clip-${d.id}`)
      .append("circle")
      .attr("r", 18);

    node.append("image")
      .attr("xlink:href", d => d.avatar)
      .attr("x", -18)
      .attr("y", -18)
      .attr("width", 36)
      .attr("height", 36)
      .attr("clip-path", d => `url(#clip-${d.id})`);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  return (
    <div className="flex flex-col h-screen relative bg-[#050505] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_70%)] pointer-events-none" />
      
      <div className="p-6 border-b border-white/5 relative z-10 flex items-center justify-between glass">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-jtweet-cyan/10 border border-jtweet-cyan/30 flex items-center justify-center text-jtweet-cyan shadow-cyan">
             <Brain size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-white">Neural Mesh</h1>
            <p className="text-[10px] text-white/40 uppercase font-mono">Real-time Signal Conductivity Visualization</p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <Stat label="Active Nodes" value="Calculated" icon={<Users size={14}/>} />
           <Stat label="Connectivity" value="High Pulse" icon={<Zap size={14}/>} />
        </div>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-jtweet-black/40 backdrop-blur-sm">
             <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-2 border-jtweet-cyan/20 border-t-jtweet-cyan rounded-full animate-spin shadow-cyan" />
               <p className="text-[10px] font-bold text-jtweet-cyan uppercase tracking-[0.3em] font-mono">Syncing Neural Nodes...</p>
             </div>
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-24 right-6 w-72 glass p-6 rounded-3xl border border-white/10 z-20 shadow-2xl backdrop-blur-3xl"
          >
            <button 
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-center text-center">
               <div className="w-20 h-20 rounded-2xl overflow-hidden glass border border-jtweet-cyan/30 p-1 mb-4 shadow-cyan">
                  <img src={selectedNode.avatar} className="w-full h-full object-cover rounded-xl" />
               </div>
               <h2 className="text-lg font-bold text-jtweet-cyan">{selectedNode.name}</h2>
               <p className="text-xs text-white/40 font-mono uppercase mt-1 tracking-widest">@{selectedNode.name.toLowerCase().replace(/ /g, '_')}</p>
               <div className="mt-2 text-[10px] bg-jtweet-cyan/10 border border-jtweet-cyan/20 text-jtweet-cyan px-2 py-0.5 rounded-full uppercase font-bold">
                  {selectedNode.role}
               </div>
               
               <div className="w-full h-px bg-white/5 my-6" />
               
               <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-[8px] uppercase text-white/40 mb-1">Signal Strength</p>
                     <p className="text-sm font-bold text-jtweet-cyan font-mono">98.4%</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-[8px] uppercase text-white/40 mb-1">Engagements</p>
                     <p className="text-sm font-bold text-white font-mono">1.2K</p>
                  </div>
               </div>
               
               <button 
                 onClick={() => navigate(`/profile/${selectedNode.id}`)}
                 className="w-full mt-6 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-jtweet-cyan transition-colors"
               >
                 Infiltrate Node
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 border-t border-white/5 glass flex justify-between items-center px-8 relative z-10">
         <div className="flex items-center gap-6">
            <LegendItem color="bg-jtweet-cyan" label="Active Pulses" />
            <LegendItem color="bg-white/10" label="Dormant Nodes" />
         </div>
         <p className="text-[9px] font-mono text-white/20 uppercase">Core Conductivity: ALPHA-7-FLUX</p>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 p-2 px-4 rounded-xl border border-white/5">
       <div className="text-jtweet-cyan">{icon}</div>
       <div className="flex flex-col">
          <span className="text-[8px] uppercase text-white/40">{label}</span>
          <span className="text-xs font-bold text-white">{value}</span>
       </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
       <div className={`w-2 h-2 rounded-full ${color}`} />
       <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}
