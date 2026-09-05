import React from 'react';
import { motion } from 'motion/react';

interface InnovxLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const InnovxIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="GoDrishti Brand Emblem"
    >
      {/* Outer circular badge frame */}
      <circle
        cx="100"
        cy="100"
        r="75"
        stroke="#403129"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Left side: Bovine / Cow Head Profile Silhouette */}
      <path
        d="M 68 54 
           C 62 54, 55 58, 48 64 
           C 40 68, 33 69, 28 66 
           C 26 65, 25 67, 26 70 
           C 29 76, 37 80, 43 81 
           C 42 85, 43 90, 44 94 
           C 41 97, 36 102, 36 109 
           C 36 116, 42 121, 48 122 
           C 53 126, 58 129, 66 131 
           C 62 136, 58 142, 54 147 
           C 48 135, 44 122, 42 106 
           C 40 88, 46 72, 58 60 
           Z"
        fill="#403129"
      />

      {/* Cow Horn curvature */}
      <path
        d="M 52 58 C 47 48, 43 40, 40 34 C 44 37, 50 44, 56 52 Z"
        fill="#403129"
      />

      {/* Cow Muzzle detail */}
      <path
        d="M 48 122 C 45 124, 41 125, 38 124 C 37 123, 38 120, 40 118 C 43 117, 46 119, 48 122 Z"
        fill="#8A5B3D"
      />

      {/* Cow Eye feature */}
      <ellipse
        cx="50"
        cy="86"
        rx="3.5"
        ry="5"
        transform="rotate(-20 50 86)"
        fill="#F9F8F6"
      />
      <circle cx="50" cy="86" r="2" fill="#403129" />

      {/* Stylized "X" - Dark Brown Backslash Bar (\) */}
      <polygon
        points="68,52 94,52 148,148 122,148"
        fill="#403129"
      />

      {/* Stylized "X" - Rich Bronze Diagonal Slash Bar (/) with Extended Chiseled Tips */}
      <polygon
        points="178,20 162,24 95,108 26,178 42,174 111,90"
        fill="#8A5B3D"
      />

      {/* Right side: Modern IoT Circuit & Sensor Telemetry Traces */}
      {/* Top Circuit Trace */}
      <path
        d="M 132 76 L 152 76 L 166 62"
        stroke="#403129"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="170" cy="58" r="4.5" fill="#403129" />

      {/* Middle Circuit Trace */}
      <path
        d="M 142 100 L 174 100"
        stroke="#403129"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="180" cy="100" r="4.5" fill="#403129" />

      {/* Bottom Circuit Trace */}
      <path
        d="M 136 124 L 154 124 L 166 136"
        stroke="#403129"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="171" cy="141" r="4.5" fill="#403129" />

      {/* Bottom Center: Sprouting Agricultural / Health Leaves */}
      {/* Left Leaf */}
      <path
        d="M 100 178 C 94 165, 86 158, 80 161 C 82 170, 92 176, 100 178 Z"
        fill="#403129"
      />
      {/* Right Leaf */}
      <path
        d="M 100 178 C 106 165, 114 158, 120 161 C 118 170, 108 176, 100 178 Z"
        fill="#8A5B3D"
      />
    </svg>
  );
};

export const InnovxLogo: React.FC<InnovxLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  animated = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: { icon: 32, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 40, text: 'text-lg sm:text-xl', sub: 'text-[10px] sm:text-xs' },
    lg: { icon: 56, text: 'text-2xl', sub: 'text-xs sm:text-sm' },
    xl: { icon: 80, text: 'text-3xl sm:text-4xl', sub: 'text-sm sm:text-base' },
  };

  const currentSize = sizeMap[size];

  // Animation variants adhering strictly to the prompt:
  // - Smooth fade-in
  // - Slight scale-up
  // - Gentle slide-in
  // - Soft glow effect
  //
  // Load sequence:
  // 1. The IX logo icon smoothly appears.
  // 2. The INNOVX text gently fades/slides in.
  // 3. The subtitle appears smoothly afterward.
  // Fast, professional, smooth, not distracting.
  const iconVariants = {
    initial: {
      opacity: animated ? 0 : 1,
      scale: animated ? 0.88 : 1,
      filter: 'drop-shadow(0 0 0px rgba(138, 91, 61, 0))',
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: [
        'drop-shadow(0 0 0px rgba(138, 91, 61, 0))',
        'drop-shadow(0 2px 10px rgba(138, 91, 61, 0.4))',
        'drop-shadow(0 1px 3px rgba(138, 91, 61, 0.15))',
      ],
      transition: {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const textVariants = {
    initial: {
      opacity: animated ? 0 : 1,
      x: animated ? -10 : 0,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.45,
        delay: animated ? 0.22 : 0,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const subtitleVariants = {
    initial: {
      opacity: animated ? 0 : 1,
      y: animated ? 4 : 0,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: animated ? 0.42 : 0,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}
    >
      {/* 1. IX Logo Icon with subtle premium animation & soft glow */}
      <motion.div
        variants={iconVariants}
        initial="initial"
        animate="animate"
        className="shrink-0 relative flex items-center justify-center"
      >
        <InnovxIcon size={currentSize.icon} />
      </motion.div>

      {/* Brand Wordmark & Subtitle */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          {/* 2. INNOVX text gently fading/sliding in */}
          <motion.div
            variants={textVariants}
            initial="initial"
            animate="animate"
            className="flex items-center"
          >
            <span
              className={`font-black tracking-tight text-[#403129] ${currentSize.text}`}
              style={{ letterSpacing: '0.04em' }}
            >
              GoDrishti
            </span>
          </motion.div>

          {/* 3. Subtitle smoothly appearing afterward */}
          {showSubtitle && (
            <motion.p
              variants={subtitleVariants}
              initial="initial"
              animate="animate"
              className={`text-[#746E68] font-medium tracking-tight mt-0.5 ${currentSize.sub} hidden min-[480px]:block`}
            >
              AI Dairy Livestock Health Intelligence
            </motion.p>
          )}
        </div>
      )}
    </div>
  );
};
