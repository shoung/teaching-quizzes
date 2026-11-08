import { Component } from 'react';
import type { ReactNode } from 'react';

export class PreviewBoundary extends Component<{
  children: ReactNode;
  scene?: boolean;
  onTalk?: () => void;
}, { failed: boolean }> {
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true};}
  render(){
    if(!this.state.failed)return this.props.children;
    if(this.props.scene)return <div className="md-scene-status"><h2>用文字繼續這一天</h2><p>3D 場景暫時無法載入。<br/>六個決策與當日回顧一樣可以完成。</p><button className="md-primary" onClick={this.props.onTalk}>繼續目前任務</button><small>使用畫面上的紅色按鈕，繼續目前任務。</small></div>;
    return <main style={{minHeight:'100dvh',display:'grid',placeContent:'center',gap:'1rem',padding:'2rem',background:'#14232b',color:'#edf0e9',textAlign:'center'}}><h1 style={{fontSize:'1.75rem'}}>行銷人的一天</h1><p>遊戲暫時無法載入，請重新整理再試一次。</p><button style={{font:'inherit',padding:'.8rem 1rem',background:'#c32d3e',color:'white',border:'1px solid #ec7380',borderRadius:'4px'}} onClick={()=>window.location.reload()}>重新載入遊戲</button></main>;
  }
}
