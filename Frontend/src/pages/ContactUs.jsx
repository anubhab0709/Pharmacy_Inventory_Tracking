import React, { useState } from "react";
import { C } from "../theme";
import { PageHdr, Card, FInput, FTextarea, Btn, Icon } from "../components/SharedUI";
import { toast } from "react-toastify";

const FAQS = [
  { q: "How do I add a new medicine to inventory?", a: "Go to the Medicines page and click 'Add Medicine'. Fill out the required details like name, category, and minimum threshold." },
  { q: "What happens when inventory goes below the threshold?", a: "The Dashboard and Stock Tracker will highlight strings of low-stock medicines in red or orange alerts, so you know exactly what needs restocked." },
  { q: "How do I switch to dark mode?", a: "Use the toggle button in the bottom left sidebar!" },
];

export default function ContactUs() {
  const [form, setForm] = useState({ email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!form.email || !form.message) {
      toast.error("Email and Message are required!");
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent successfully! Our team will contact you soon.");
      setForm({ email: "", subject: "", message: "" });
    }, 800);
  };

  return (
    <div style={{padding:"30px 40px",maxWidth:1000,margin:"0 auto",width:"100%"}}>
      <PageHdr tag="Support" title="Contact Us" sub="Get in touch with the PharmaCare support team or browse our FAQs." />

      <div style={{display:"flex",gap:30,flexWrap:"wrap"}}>
        {/* Contact Form */}
        <Card style={{flex:1,minWidth:320}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
            <Icon name="activity" size={18} color={C.teal} />
            <h2 style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:600,color:C.text,margin:0}}>Send a Message</h2>
          </div>
          
          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:16}}>
            <FInput label="Email ID" type="email" placeholder="pharmacist@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
            <FInput label="Subject" placeholder="How can we help?" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} />
            <FTextarea label="Message" placeholder="Describe your issue..." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required style={{minHeight:120}} />
            <div style={{marginTop:8}}>
              <Btn type="submit" disabled={loading} icon="check">
                {loading ? "Sending..." : "Send Message"}
              </Btn>
            </div>
          </form>
        </Card>

        {/* FAQs */}
        <Card style={{flex:1,minWidth:320}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
            <Icon name="info" size={18} color={C.orange} />
            <h2 style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:600,color:C.text,margin:0}}>Frequently Asked Questions</h2>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",transition:"all 0.2s"}}>
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:C.surface,border:"none",cursor:"pointer",color:C.text,fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:500,textAlign:"left"}}>
                  <span>{faq.q}</span>
                  <Icon name="arrowright" size={14} color={C.dim} style={{transform:openFaq===i?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.2s"}}/>
                </button>
                {openFaq === i && (
                  <div style={{padding:"0 16px 16px",color:C.muted,fontSize:13,lineHeight:1.5,borderTop:`1px solid ${C.border}`,background:C.surfaceHover}}>
                    <div style={{paddingTop:12}}>{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{marginTop:32,padding:16,background:"rgba(var(--primary-rgb),0.05)",borderRadius:8,border:`1px solid ${C.border}`}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600,color:C.text,margin:"0 0 4px"}}>Still need help?</p>
            <p style={{color:C.muted,fontSize:12,margin:0}}>Call our 24/7 hotline toll-free at <strong style={{color:C.teal}}>1-800-PHARMA</strong> or email directly to support@pharmacare.com.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
