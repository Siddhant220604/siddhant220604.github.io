import { config } from "../config";
import "./styles/CallToAction.css";

const CallToAction = () => {
  return (
    <div className="cta-section">
      <div className="cta-buttons">
        <a
          href="/SiddhantJ.pdf"
          download="Siddhant-Jaiswal-Resume.pdf"
          className="cta-btn cta-btn-play"
          data-cursor="disable"
        >
          Résumé →
        </a>

        <a
          href={config.contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-btn cta-btn-hire"
          data-cursor="disable"
        >
          Hire Me →
        </a>
      </div>
    </div>
  );
};

export default CallToAction;
