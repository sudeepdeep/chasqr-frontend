import {
  Award,
  Check,
  Clock,
  Code2,
  Globe,
  Heart,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Rocket,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

/**
 * Icons offered in the toolbar picker, keyed by the name stored on the element.
 *
 * Its own module rather than a second export from the element view: a file that
 * exports both components and plain values cannot be hot-swapped, and that
 * failure shows up as a confusing runtime "not defined" rather than as a
 * compile error.
 */
export const ICONS: Record<string, any> = {
  star: Star,
  check: Check,
  zap: Zap,
  heart: Heart,
  mail: Mail,
  phone: Phone,
  "map-pin": MapPin,
  shield: Shield,
  rocket: Rocket,
  sparkles: Sparkles,
  globe: Globe,
  lock: Lock,
  users: Users,
  clock: Clock,
  award: Award,
  "trending-up": TrendingUp,
  "thumbs-up": ThumbsUp,
  message: MessageCircle,
  code: Code2,
};

export const ICON_NAMES = Object.keys(ICONS);

/**
 * Brand marks are drawn as letter badges rather than logos.
 *
 * lucide dropped its brand icons in v1, and shipping traced copies of company
 * logos is a trademark problem nobody needs. A letter badge reads correctly in
 * the editor; the published page can carry real marks once we add an icon set
 * licensed for it.
 */
export const SOCIAL_LABEL: Record<string, string> = {
  twitter: "X",
  x: "X",
  instagram: "IG",
  linkedin: "in",
  facebook: "f",
  github: "GH",
  youtube: "YT",
  tiktok: "TT",
  dribbble: "Dr",
  email: "@",
};
