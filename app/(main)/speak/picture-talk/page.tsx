import { getAllPictures } from "@/lib/picture-talk-data";
import { PictureTalkPlayer } from "@/components/picture-talk/picture-talk-player";

export default function PictureTalkPage() {
  const pictures = getAllPictures();
  return <PictureTalkPlayer pictures={pictures} />;
}