const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "data/phrases-advanced.txt");

function block(level, vn, en) {
  return `[${level}]\n${vn}\n${en}\n`;
}

const phrases = [
  ["Tôi muốn đặt lịch hẹn tắm cắt tại salon tóc.", "I want to book a haircut appointment at the salon."],
  ["Tôi cần mua thuốc men định kỳ cho bệnh mãn tính.", "I need to buy regular prescription medicine for chronic disease."],
  ["Tôi muốn thanh toán hóa đơn điện thoại qua ứng dụng.", "I want to pay the phone bill via the app."],
  ["Tôi muốn đổi số điện thoại mới trên sim cũ.", "I want to change to a new phone number on the old SIM."],
  ["Tôi cần mua thẻ cước dữ liệu cho chuyến du lịch.", "I need to buy a data top-up card for the trip."],
  ["Tôi muốn đăng ký gói điện thoại di động hàng tháng.", "I want to register for a monthly mobile phone plan."],
  ["Tôi muốn mua bìa bảo vệ cho điện thoại thông minh.", "I want to buy a protective case for the smartphone."],
  ["Tôi muốn mua kẻo màn hình chống trầy xước.", "I want to buy a scratch-resistant screen protector."],
  ["Tôi cần sạc đầy pin trước khi đi làm mỗi sáng.", "I need to fully charge the battery before going to work every morning."],
  ["Tôi muốn tắt thông báo không cần thiết trên điện thoại.", "I want to turn off unnecessary notifications on the phone."],
  ["Tôi muốn sao lưu ảnh lên đám mây hàng tuần.", "I want to back up photos to the cloud weekly."],
  ["Tôi cần dọn bẩn bộ nhớ điện thoại vì không đủ dung lượng.", "I need to clean phone storage because there is not enough space."],
  ["Tôi muốn cập nhật hệ điều hành điện thoại lên phiên bản mới.", "I want to update the phone operating system to the new version."],
  ["Tôi muốn cài đặt ứng dụng ngân hàng từ cửa hàng ứng dụng.", "I want to install the banking app from the app store."],
  ["Tôi cần đăng nhập bằng vân tay thay vì mật khẩu.", "I need to log in by fingerprint instead of password."],
  ["Tôi muốn đặt lịch giao hàng vào thứ Ba chiều.", "I want to schedule delivery for Tuesday afternoon."],
  ["Tôi cần kiểm tra trạng thái đơn hàng trên website.", "I need to check the order status on the website."],
  ["Tôi muốn đổi trả hàng hóa vì kích thước không vừa.", "I want to exchange the item because the size does not fit."],
  ["Tôi cần yêu cầu hoàn tiền cho đơn hàng bị hủy.", "I need to request a refund for the canceled order."],
  ["Tôi muốn đánh giá sản phẩm sau khi sử dụng một tuần.", "I want to rate the product after using it for a week."],
  ["Tôi cần liên hệ bộ phận chăm sóc khách hàng về vấn đề giao hàng.", "I need to contact customer service about the delivery issue."],
  ["Tôi muốn mua vé xem thể thao tại sân vận động.", "I want to buy a sports ticket at the stadium."],
  ["Tôi cần đăng ký tham gia lớp yoga buổi sáng thứ Ba.", "I need to register for the Tuesday morning yoga class."],
  ["Tôi muốn mua thẻ thành viên của phòng tập thể dục.", "I want to buy a gym membership card."],
  ["Tôi muốn mua áo bóng đá đội tuyển quốc gia.", "I want to buy the national football team jersey."],
  ["Tôi cần mua vé xem phim rạp cuối tuần này.", "I need to buy a cinema ticket for this weekend."],
  ["Tôi muốn mua palan nước uống cho gia đình.", "I want to buy a water dispenser for the family."],
  ["Tôi cần mua lít nước đóng chai cho gia đình mỗi tuần.", "I need to buy liters of bottled water for the family every week."],
  ["Tôi muốn mua bình lọc nước ngửa đầu vòi.", "I want to buy a faucet-mount water filter."],
  ["Tôi muốn mua máy hút bụi ręt nhỏ cho phòng ngủ.", "I want to buy a small handheld vacuum for the bedroom."],
  ["Tôi cần mua sách giáo khoa cho học kỳ mới.", "I need to buy textbooks for the new semester."],
  ["Tôi muốn mua bút viết và vở ghi chép cho học tập.", "I want to buy pens and notebooks for studying."],
  ["Tôi cần mua balo học sinh cho con tôi.", "I need to buy a school backpack for my child."],
  ["Tôi muốn mua bút chì và cạo bút cho lớp học.", "I want to buy pencils and sharpeners for the class."],
  ["Tôi muốn mua tua sách tiểu thuyết tiếng Anh gốc.", "I want to buy original English novels."],
  ["Tôi cần mua từ điển Anh Việt cho học tập.", "I need to buy an English-Vietnamese dictionary for studying."],
  ["Tôi muốn mua bìa mỏng bọc sách giáo khoa.", "I want to buy thin covers for textbooks."],
  ["Tôi cần mua dowel keo dán giấy cho công việc.", "I need to buy paper glue for work."],
  ["Tôi muốn mua kim cương dán notes trên bàn làm việc.", "I want to buy sticky notes on the desk."],
  ["Tôi cần mua bìa hồ sơ để giấy tờ văn phòng.", "I need to buy file folders for office documents."],
  ["Tôi muốn mua máy in màu cho văn phòng nhà.", "I want to buy a color printer for the home office."],
  ["Tôi cần mua mực in cartridge cho máy in.", "I need to buy ink cartridges for the printer."],
  ["Tôi muốn mua giấy in A4 cho văn phòng.", "I want to buy A4 printing paper for the office."],
  ["Tôi cần mua bìa đựng CD và DVD lưu trữ dữ liệu.", "I need to buy CD and DVD cases for data storage."],
  ["Tôi muốn mua cáp kết nối điện thoại với máy tính.", "I want to buy a cable connecting phone to computer."],
  ["Tôi cần mua adaptor đa cổng cho máy tính xách tay.", "I need to buy a multiport adapter for the laptop."],
  ["Tôi muốn mua túi đựng laptop chống sốc.", "I want to buy a shock-proof laptop bag."],
  ["Tôi cần mua băng keo dính 사무 처리 công việc."], // skip garbage
  ["Tôi muốn mua kéo văn phòng trên bàn làm việc.", "I want to buy office scissors on the desk."],
  ["Tôi cần mua bút đánh dấu màu cho tài liệu quan trọng.", "I need to buy highlighter pens for important documents."],
  ["Tôi muốn mua máy machines tinh điện computers."], // skip garbage
  ["Tôi cần mua máy tính xách tay cho công việc từ xa.", "I need to buy a laptop for remote work."],
  ["Tôi muốn mua bàn phím ngoài cho máy tính xách tay.", "I want to buy an external keyboard for the laptop."],
  ["Tôi cần mua chuột không dây cho laptop.", "I need to buy a wireless mouse for the laptop."],
  ["Tôi muốn mua đệm chuột lớn cho bàn làm việc.", "I want to buy a large mousepad for the desk."],
  ["Tôi cần mua quai đeo tai nghe cho làm việc.", "I need to buy a headset for work."],
  ["Tôi muốn mua webcam cho cuộc họp trực tuyến.", "I want to buy a webcam for online meetings."],
  ["Tôi cần mua microfono ngoài cho ghi âm rõ nét."], // skip garbage
  ["Tôi muốn mua áo vest công sở nam thanh lịch.", "I want to buy a stylish men's office suit jacket."],
  ["Tôi cần mua áo sơ mi trắng đi làm mỗi ngày.", "I need to buy white shirts to wear to work every day."],
  ["Tôi muốn mua quần kaki màu xám cho văn phòng.", "I want to buy gray khaki pants for the office."],
  ["Tôi cần mua giày da nam đi công sở thời tiết lạnh.", "I need to buy men's leather shoes for the cold-weather office."],
  ["Tôi muốn mua quần áo thể thao để đi tập gym.", "I want to buy sportswear to go to the gym."],
  ["Tôi cần mua áo mưa chống nước cho mùa mưa.", "I need to buy a waterproof raincoat for the rainy season."],
  ["Tôi muốn mua áo khoác len cho mùa đông lạnh.", "I want to buy a sweater for the cold winter."],
  ["Tôi cần mua khăn tắm mềm cho gia đình.", "I need to buy soft towels for the family."],
  ["Tôi muốn mua chăn nệm mát cho mùa hè nóng.", "I want to buy cool bedding for hot summer."],
  ["Tôi cần mua gối ngõpur orthopedic cho khổ vào."], // skip garbage
  ["Tôi muốn mua chăn bông dịu nhạt cho trẻ em.", "I want to buy a gentle cotton blanket for children."],
  ["Tôi cần mua chậu hoa nhựa để trồng cây trong nhà.", "I need to buy plastic pots to grow plants indoors."],
  ["Tôi muốn mua hạt giống rau ăn rau sạch tại nhà.", "I want to buy vegetable seeds to grow clean vegetables at home."],
  ["Tôi cần mua phân bón hữu cơ cho cây trồng.", "I need to buy organic fertilizer for plants."],
  ["Tôi muốn mua vòi tưới cây vườn nhỏ.", "I want to buy a small garden hose."],
  ["Tôi cần mua kiasi làm vườn cho Hobby."], // skip garbage
  ["Tôi muốn mua dao cắt cỏ vườn nhỏ.", "I want to buy a small grass cutter for the garden."],
  ["Tôi cần mua bình xịt thuốc trừ sâu cho cây.", "I need to buy a pesticide spray bottle for plants."],
  ["Tôi muốn mua ghế ngồi vườn ngoài trời.", "I want to buy outdoor garden chairs."],
  ["Tôi cần mua bàn ăn ngoài trời cho sân nhà.", "I need to buy an outdoor dining table for the yard."],
  ["Tôi muốn mua rèm cửa che nắng cho phòng ngủ.", "I want to buy blackout curtains for the bedroom."],
  ["Tôi cần mua thảm l umieszcz trên sàn phòng khách."], // skip garbage
  ["Tôi muốn mua đèn ngủ bedside cho phòng ngủ.", "I want to buy a bedside lamp for the bedroom."],
  ["Tôi cần mua đồng hồ báo thức thức dậy sáng sớm.", "I need to buy an alarm clock to wake up early."],
  ["Tôi muốn mua gương soi trang điểm cho nhà vệ sinh.", "I want to buy a makeup mirror for the bathroom."],
  ["Tôi cần mua kệ tắm đặt đồ toilet trong nhà vệ sinh.", "I need to buy a bathroom shelf for toilet items."],
  ["Tôi muốn mua khay đựng xà tichia và kem đánh răng.", "I want to buy a tray for soap and toothpaste."],
  ["Tôi cần mua chậu nước rửa tay trong nhà vệ sinh khách.", "I need to buy a hand-wash basin in the guest bathroom."],
  ["Tôi muốn mua vòi sen tắm đảo mặt trời.", "I want to buy a solar shower head."],
  ["Tôi cần mua bình nóng lạnh cho nhà vệ sinh.", "I need to buy a water heater for the bathroom."],
  ["Tôi muốn mua vesinh s toilet starken."], // skip garbage
  ["Tôi cần mua bát ăn và đũa cho gia đình.", "I need to buy bowls and chopsticks for the family."],
  ["Tôi muốn mua đĩa đĩa trang trí cho bữa tiệc.", "I want to buy decorative plates for the party."],
  ["Tôi cần mua nồi nấu Inox cho nhà bếp.", "I need to buy stainless steel cookware for the kitchen."],
  ["Tôi muốn mua chảo chiên không dính choăn nếm."], // skip garbage
  ["Tôi cần mua thìa nấu và cho muối để nấu ăn.", "I need to buy cooking spoons and salt shakers for cooking."],
  ["Tôi muốn mua đũa content nấu ăn."], // skip garbage
  ["Tôi cần mua tuồng nêm gia vị trong nhà bếp.", "I need to buy seasoning containers in the kitchen."],
  ["Tôi muốn mua tủ lạnh nhỏ cho phòng ngủ con.", "I want to buy a small fridge for the child's bedroom."],
  ["Tôi cần mua lò nướng nhỏ cho bếp gia đình.", "I need to buy a small oven for the family kitchen."],
  ["Tôi muốn mua máy xay sinh tố cho sinh thức sáng.", "I want to buy a blender for morning smoothies."],
  ["Tôi cần mua máy ép trái cây cho nước ép tươi.", "I need to buy a juicer for fresh juice."],
  ["Tôi muốn mua nồi cơm điện lớn cho gia đình đông người.", "I want to buy a large rice cooker for a big family."],
  ["Tôi cần mua chảo vapor hấp dim sum cho bữa sáng.", "I need to buy a steamer pan for dim sum breakfast."],
  ["Tôi muốn mua bát enchong mía."], // skip garbage
  ["Tôi cần mua bộ dao cắt thực phẩm cho nhà bếp.", "I need to buy kitchen food cutting knives."],
  ["Tôi muốn mua tảng cắt thực phẩm nhựa an toàn.", "I want to buy a safe plastic cutting board."],
  ["Tôi cần mua hộp đựng thức ăn để bảo quản tủ lạnh.", "I need to buy food storage containers for the fridge."],
  ["Tôi muốn mua túi nilon đựng thực phẩm đựng lạnh.", "I want to buy plastic bags for frozen food."],
  ["Tôi cần mua nhựa bọc thực phẩm bảo quản tươi.", "I need to buy food wrap to keep fresh."],
  ["Tôi muốn mua lá chum lý đá نگ."], // skip garbage
  ["Tôi cần mua đèn lanSuối nhà bếp."], // skip garbage
  ["Tôi muốn mua nắp nồi thay thế cho nồi cũ.", "I want to buy replacement lids for old pots."],
  ["Tôi cần mua tay cầm nồi chịu nhiệt để bám nồi nóng.", "I need heat-resistant pot holders to hold hot pots."],
  ["Tôi muốn mua g valeurs múa bếp."], // skip garbage
  ["Tôi cần mua tuồng tương ấm gia đình."], // skip garbage
];

const garbageMarkers = [
  "s务处理", "đouer", "loances", "tinh điện", "computers", "microfono", "ngõpur",
  "orthopedic", "kiasi làm vườn", "Hobby", "l umiesz", "vesinh s toilet starken",
  "choăn nếm", "content nấu ăn", "enchong mía", "lanSuối", "gi values múa bếp",
  "tuồng tương ấm gia đình", "bát enchong mía", "laplap", "da نگ", "sí"
];

const clean = phrases.filter(p => {
  const vn = p[0];
  return !garbageMarkers.some(m => vn.includes(m));
});

console.log(`Kept ${clean.length} of ${phrases.length} phrases`);

let append = "";
let levelIdx = 0;
for (const [vn, en] of clean) {
  const level = levelIdx % 2 === 0 ? "B1" : "B2";
  append += block(level, vn, en);
  levelIdx++;
}

fs.appendFileSync(FILE, append, "utf8");

const raw = fs.readFileSync(FILE, "utf8");
const labels = raw.split(/\r?\n/).filter(l => /^\[B[12]\]/.test(l.trim())).length;
console.log(`Appended ${clean.length} phrases. New advanced-label count: ${labels}`);
