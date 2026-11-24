// Add translation (VI), vocabulary (IPA + meaning) and exercises to all A2
// reading passages. Existing fields (questions, text, etc.) are preserved.
//
// Exercises use options (multiple choice) so grading is exact.
//
// Usage: node scripts/work/add-reading-content.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const DATA_PATH = path.join(ROOT, "data", "reading-passages.json");
const BACKUP_PATH = path.join(ROOT, "data", "reading-passages.backup.json");

const passages = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(passages, null, 2));
}

const v = (word, ipa, meaning, pos) => ({ word, ipa, meaning, pos });
const ex = (id, type, instruction, question, options, answer, explanation) => ({
  id, type, instruction, question, options, answer, explanation,
});

const CONTENT = {
  "read-a2-1": {
    translation:
      "Tôi tên là Anna. Tôi bắt đầu một công việc mới tuần trước tại một hiệu sách nhỏ ở trung tâm thành phố. Tôi làm việc từ chín giờ sáng đến năm giờ chiều. Công việc chính của tôi là giúp khách hàng tìm sách và sắp xếp các kệ sách. Ông chủ cửa hàng, ông Brown, rất tốt và kiên nhẫn. Ông đang dạy tôi cách sử dụng hệ thống máy tính. Tôi thích công việc này vì tôi yêu đọc sách và gặp gỡ mọi người. Vấn đề duy nhất là cửa hàng khá xa nhà tôi, nên mỗi sáng tôi phải đi hai chuyến xe buýt. Tháng sau tôi hy vọng mua một chiếc xe đạp để việc đi lại dễ dàng hơn.",
    vocabulary: [
      v("bookshop", "/ˈbʊkʃɒp/", "hiệu sách", "n"),
      v("customer", "/ˈkʌstəmər/", "khách hàng", "n"),
      v("organize", "/ˈɔːrɡənaɪz/", "sắp xếp", "v"),
      v("shelf", "/ʃelf/", "kệ sách (số nhiều: shelves)", "n"),
      v("patient", "/ˈpeɪʃnt/", "kiên nhẫn", "adj"),
      v("owner", "/ˈoʊnər/", "chủ sở hữu", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "Anna's main job is to help ___ find books.", ["customers", "teachers", "doctors", "drivers"], "customers", "Anna giúp khách hàng (customers) tìm sách."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất với từ in đậm.", "'Kind' is closest in meaning to ___.", ["nice", "angry", "lazy", "busy"], "nice", "'Kind' (tử tế) ≈ 'nice' (tốt bụng)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["She work every morning.", "She works every morning.", "She working every morning.", "She is work every morning."], "She works every morning.", "Chủ ngữ số ít 'she' + động từ thêm -s: 'works'."),
    ],
  },
  "read-a2-2": {
    translation:
      "Hôm nay là thứ Bảy, nhưng thời tiết rất tệ. Trời đã mưa từ sáng sớm. Tôi muốn đi công viên, nhưng giờ tôi phải ở nhà. Tôi và anh trai quyết định nướng một chiếc bánh. Chúng tôi trộn bột mì, đường, trứng và bơ trong một cái tô lớn. Trong khi bánh ở trong lò, chúng tôi xem một bộ phim hài. Cả ngôi nhà thơm lừng. Khi bánh chín, chúng tôi chia cho bố mẹ. Dù thời tiết xấu, chúng tôi vẫn có một ngày thật vui bên nhau.",
    vocabulary: [
      v("weather", "/ˈweðər/", "thời tiết", "n"),
      v("bake", "/beɪk/", "nướng, làm bánh", "v"),
      v("flour", "/ˈflaʊər/", "bột mì", "n"),
      v("butter", "/ˈbʌtər/", "bơ", "n"),
      v("oven", "/ˈʌvn/", "lò nướng", "n"),
      v("smell", "/smel/", "có mùi, thơm", "v"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "They decided to ___ a cake instead of going to the park.", ["bake", "buy", "eat", "sell"], "bake", "Họ quyết định nướng (bake) một chiếc bánh."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Lovely' is closest in meaning to ___.", ["wonderful", "terrible", "boring", "sad"], "wonderful", "'Lovely' (đáng yêu, tuyệt) ≈ 'wonderful'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["We was watching a movie.", "We were watching a movie.", "We were watch a movie.", "We watching a movie."], "We were watching a movie.", "Quá khứ tiếp diễn: 'we' + 'were' + V-ing."),
    ],
  },
  "read-a2-3": {
    translation:
      "Bạn thân của tôi tên là Minh. Chúng tôi biết nhau từ hồi tiểu học. Minh cao và có mái tóc đen ngắn. Cậu ấy rất hài hước và luôn làm tôi cười. Cả hai đều thích chơi bóng đá và nghe nhạc. Vào cuối tuần, chúng tôi thường đạp xe đến bờ sông và dã ngoại. Minh muốn trở thành bác sĩ vì cậu ấy thích giúp đỡ mọi người. Tôi muốn trở thành giáo viên. Chúng tôi đã hứa sẽ mãi là bạn, ngay cả khi chuyển đến các thành phố khác để học đại học.",
    vocabulary: [
      v("primary school", "/ˈpraɪmeri skuːl/", "trường tiểu học", "n"),
      v("short", "/ʃɔːrt/", "ngắn", "adj"),
      v("laugh", "/læf/", "cười", "v"),
      v("picnic", "/ˈpɪknɪk/", "buổi dã ngoại", "n"),
      v("promise", "/ˈprɑːmɪs/", "hứa", "v"),
      v("forever", "/fərˈevər/", "mãi mãi", "adv"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "Minh wants to become a ___ because he likes helping people.", ["doctor", "teacher", "driver", "cook"], "doctor", "Minh muốn trở thành bác sĩ (doctor)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Funny' is closest in meaning to ___.", ["humorous", "serious", "quiet", "rude"], "humorous", "'Funny' (hài hước) ≈ 'humorous'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["He have short black hair.", "He has short black hair.", "He having short black hair.", "He is has short black hair."], "He has short black hair.", "'He' đi với 'has'."),
    ],
  },
  "read-a2-4": {
    translation:
      "Mỗi Chủ nhật, mẹ tôi và tôi đến siêu thị để mua thức ăn cho cả tuần. Chúng tôi luôn mang theo một danh sách đi chợ để không quên gì. Tuần này chúng tôi cần gạo, trứng, sữa, rau và một ít trái cây. Siêu thị rất lớn và có nhiều khu vực khác nhau. Phần yêu thích của tôi là tiệm bánh, vì bánh mì thơm quá. Mẹ tôi thường mua cá tươi vào thứ Sáu, nhưng hôm nay bà chọn thịt gà. Khi thanh toán, chúng tôi trả bằng thẻ. Sau đó chúng tôi mang những chiếc túi nặng về nhà và cất mọi thứ vào tủ lạnh.",
    vocabulary: [
      v("supermarket", "/ˈsuːpərmɑːrkɪt/", "siêu thị", "n"),
      v("list", "/lɪst/", "danh sách", "n"),
      v("section", "/ˈsekʃn/", "khu vực", "n"),
      v("bakery", "/ˈbeɪkəri/", "tiệm bánh", "n"),
      v("fresh", "/freʃ/", "tươi", "adj"),
      v("checkout", "/ˈtʃekaʊt/", "quầy thanh toán", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "They always take a shopping ___ so they do not forget anything.", ["list", "bag", "cart", "basket"], "list", "Họ mang theo danh sách (list) đi chợ."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Fresh' is closest in meaning to ___.", ["new", "old", "frozen", "salty"], "new", "'Fresh' (tươi) ≈ 'new' (mới)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["She buy fresh fish on Fridays.", "She buys fresh fish on Fridays.", "She buying fresh fish on Fridays.", "She is buy fresh fish on Fridays."], "She buys fresh fish on Fridays.", "'She' + động từ thêm -s: 'buys'."),
    ],
  },
  "read-a2-5": {
    translation:
      "Mùa hè năm ngoái, gia đình tôi đi biển một tuần. Chúng tôi ở trong một khách sạn nhỏ gần biển. Mỗi sáng, tôi thức dậy sớm và đi dạo trên cát. Nước ấm và trong. Em gái tôi xây lâu đài cát trong khi bố mẹ tôi đọc sách dưới một chiếc ô. Vào buổi chiều, chúng tôi ăn hải sản tươi ở một nhà hàng bên bờ nước. Một ngày nọ, chúng tôi đi thuyền và nhìn thấy cá heo. Đó là kỳ nghỉ đẹp nhất đời tôi, và tôi hy vọng năm sau chúng tôi có thể quay lại.",
    vocabulary: [
      v("beach", "/biːtʃ/", "bãi biển", "n"),
      v("sand", "/sænd/", "cát", "n"),
      v("sandcastle", "/ˈsændkæsl/", "lâu đài cát", "n"),
      v("umbrella", "/ʌmˈbrelə/", "ô, dù", "n"),
      v("seafood", "/ˈsiːfuːd/", "hải sản", "n"),
      v("dolphin", "/ˈdɑːlfɪn/", "cá heo", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "My little sister built ___ on the beach.", ["sandcastles", "houses", "cars", "boats"], "sandcastles", "Em gái xây lâu đài cát (sandcastles)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Clear' (about water) is closest in meaning to ___.", ["transparent", "dirty", "deep", "cold"], "transparent", "Nước 'clear' (trong) ≈ 'transparent' (trong suốt)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["We was staying in a hotel.", "We stayed in a hotel.", "We stay in a hotel yesterday.", "We were stay in a hotel."], "We stayed in a hotel.", "Quá khứ đơn của 'stay' là 'stayed'."),
    ],
  },
  "read-a2-6": {
    translation:
      "Khi còn trẻ, tôi chưa bao giờ nấu ăn. Nhưng sau khi chuyển đến một thành phố mới để học đại học, tôi phải học. Món đầu tiên của tôi là cơm chiên, và nó thật tệ. Dần dần, tôi khá hơn nhờ xem video và luyện tập. Giờ tôi nấu ăn gần như mỗi ngày. Món yêu thích của tôi là súp gà vì nó tốt cho sức khỏe và dễ làm. Nấu ăn giúp tôi tiết kiệm tiền và thư giãn sau khi học. Cuối tuần trước, tôi mời bạn bè đến ăn tối, và họ rất thích đồ ăn của tôi. Tôi cảm thấy tự hào về bản thân.",
    vocabulary: [
      v("dish", "/dɪʃ/", "món ăn", "n"),
      v("terrible", "/ˈterəbl/", "tệ, kinh khủng", "adj"),
      v("practice", "/ˈpræktɪs/", "luyện tập", "v"),
      v("healthy", "/ˈhelθi/", "tốt cho sức khỏe", "adj"),
      v("save", "/seɪv/", "tiết kiệm", "v"),
      v("proud", "/praʊd/", "tự hào", "adj"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The writer's first dish was fried rice, and it was ___.", ["terrible", "delicious", "perfect", "spicy"], "terrible", "Món đầu tiên thật tệ (terrible)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Proud' is closest in meaning to ___.", ["pleased", "ashamed", "angry", "tired"], "pleased", "'Proud' (tự hào) ≈ 'pleased' (hài lòng)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["She cook almost every day.", "She cooks almost every day.", "She cooking almost every day.", "She is cook almost every day."], "She cooks almost every day.", "'She' + 'cooks'."),
    ],
  },
  "read-a2-7": {
    translation:
      "Một buổi chiều, một chú chó nhỏ màu nâu xuất hiện trong vườn nhà chúng tôi. Nó trông có vẻ đói và mệt. Chúng tôi cho nó chút nước và thức ăn. Em gái tôi muốn giữ nó lại, nhưng chúng tôi quyết định tìm chủ trước. Chúng tôi làm áp phích và dán quanh khu phố. Hai ngày sau, một người phụ nữ gọi cho chúng tôi. Bà ấy đang khóc vì đã mất chó một tuần trước. Khi nhìn thấy chú chó, bà ấy rất vui. Bà cảm ơn chúng tôi và tặng một hộp sô-cô-la. Chúng tôi cảm thấy vui vì đã giúp đỡ.",
    vocabulary: [
      v("appear", "/əˈpɪr/", "xuất hiện", "v"),
      v("hungry", "/ˈhʌŋɡri/", "đói", "adj"),
      v("owner", "/ˈoʊnər/", "chủ sở hữu", "n"),
      v("poster", "/ˈpoʊstər/", "áp phích", "n"),
      v("neighborhood", "/ˈneɪbərhʊd/", "khu phố", "n"),
      v("chocolate", "/ˈtʃɑːklət/", "sô-cô-la", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The dog looked ___ and tired, so they gave it food.", ["hungry", "angry", "happy", "clean"], "hungry", "Chú chó trông đói (hungry) và mệt."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Found' is closest in meaning to ___.", ["discovered", "lost", "hid", "broke"], "discovered", "'Found' (tìm thấy) ≈ 'discovered'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["She have lost her dog.", "She had lost her dog.", "She has lose her dog.", "She losing her dog."], "She had lost her dog.", "Quá khứ hoàn thành: 'had' + quá khứ phân từ 'lost'."),
    ],
  },
  "read-a2-8": {
    translation:
      "Có năm người trong gia đình tôi. Bố tôi là kỹ sư và mẹ tôi là y tá. Tôi có một anh trai và một em gái. Chúng tôi sống trong một ngôi nhà nhỏ có sân vườn. Vào buổi tối, chúng tôi thường ăn tối cùng nhau và nói về ngày của mình. Vào Chủ nhật, chúng tôi đến thăm ông bà sống ở nông thôn. Ông tôi thích làm vườn, và bà tôi làm bánh ngon nhất. Tôi yêu gia đình mình vì chúng tôi luôn hỗ trợ nhau, ngay cả trong những lúc khó khăn.",
    vocabulary: [
      v("engineer", "/ˌendʒɪˈnɪr/", "kỹ sư", "n"),
      v("nurse", "/nɜːrs/", "y tá", "n"),
      v("garden", "/ˈɡɑːrdn/", "sân vườn", "n"),
      v("countryside", "/ˈkʌntrisaɪd/", "nông thôn", "n"),
      v("support", "/səˈpɔːrt/", "hỗ trợ", "v"),
      v("difficult", "/ˈdɪfɪkəlt/", "khó khăn", "adj"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "My father is an ___ and my mother is a nurse.", ["engineer", "artist", "driver", "farmer"], "engineer", "Bố là kỹ sư (engineer)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Difficult' is closest in meaning to ___.", ["hard", "easy", "simple", "clear"], "hard", "'Difficult' (khó) ≈ 'hard'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["There is five people in my family.", "There are five people in my family.", "There be five people in my family.", "There were five people in my family."], "There are five people in my family.", "'Five people' số nhiều → dùng 'are'."),
    ],
  },
  "read-a2-9": {
    translation:
      "Thứ Sáu tuần trước, lớp tôi đi tham quan bảo tàng khoa học. Chúng tôi rời trường lúc tám giờ sáng bằng xe buýt. Bảo tàng rất lớn và có nhiều hiện vật thú vị. Phần yêu thích của tôi là khu không gian, nơi chúng tôi có thể chạm vào đá mặt trăng thật. Chúng tôi cũng xem một bộ phim 3D về khủng long. Vào giờ ăn trưa, chúng tôi ăn bánh mì kẹp trong công viên gần bảo tàng. Vào buổi chiều, chúng tôi ghé cửa hàng quà tặng trước khi về. Mọi người đều mệt nhưng vui. Tôi học được nhiều điều và hy vọng có chuyến đi nữa sớm.",
    vocabulary: [
      v("museum", "/mjuˈziːəm/", "bảo tàng", "n"),
      v("exhibit", "/ɪɡˈzɪbɪt/", "hiện vật trưng bày", "n"),
      v("space", "/speɪs/", "không gian", "n"),
      v("dinosaur", "/ˈdaɪnəsɔːr/", "khủng long", "n"),
      v("sandwich", "/ˈsænwɪtʃ/", "bánh mì kẹp", "n"),
      v("gift shop", "/ɡɪft ʃɑːp/", "cửa hàng quà tặng", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "They left school at eight in the morning by ___.", ["bus", "train", "plane", "bike"], "bus", "Họ đi bằng xe buýt (bus)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Huge' is closest in meaning to ___.", ["enormous", "tiny", "narrow", "short"], "enormous", "'Huge' (khổng lồ) ≈ 'enormous'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["We was at the museum.", "We were at the museum.", "We were at museum yesterday.", "We at the museum."], "We were at the museum.", "'We' + 'were'."),
    ],
  },
  "read-a2-10": {
    translation:
      "Sở thích yêu thích của tôi là nhiếp ảnh. Tôi có chiếc máy ảnh đầu tiên hai năm trước như một món quà sinh nhật. Kể từ đó, tôi đã chụp hàng nghìn bức ảnh. Tôi thích chụp ảnh thiên nhiên, đặc biệt là cảnh hoàng hôn và núi non. Vào cuối tuần, tôi thường đến một công viên gần nhà với máy ảnh. Đôi khi tôi đăng những bức ảnh đẹp nhất lên mạng, và bạn bè để lại những bình luận tốt đẹp. Nhiếp ảnh dạy tôi để ý những chi tiết nhỏ mà người khác bỏ lỡ. Tôi mơ một ngày đi du lịch vòng quanh thế giới và chụp ảnh ở mọi quốc gia.",
    vocabulary: [
      v("photography", "/fəˈtɑːɡrəfi/", "nhiếp ảnh", "n"),
      v("camera", "/ˈkæmərə/", "máy ảnh", "n"),
      v("nature", "/ˈneɪtʃər/", "thiên nhiên", "n"),
      v("sunset", "/ˈsʌnset/", "hoàng hôn", "n"),
      v("detail", "/ˈdiːteɪl/", "chi tiết", "n"),
      v("country", "/ˈkʌntri/", "quốc gia", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The writer's favorite hobby is ___.", ["photography", "cooking", "reading", "swimming"], "photography", "Sở thích là nhiếp ảnh (photography)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Hobby' is closest in meaning to ___.", ["pastime", "job", "duty", "chore"], "pastime", "'Hobby' (sở thích) ≈ 'pastime' (thú tiêu khiển)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["She have taken thousands of photos.", "She has taken thousands of photos.", "She has took thousands of photos.", "She taking thousands of photos."], "She has taken thousands of photos.", "Thì hiện tại hoàn thành: 'has' + 'taken'."),
    ],
  },
  "read-a2-11": {
    translation:
      "Mỗi sáng tôi đi tàu đến chỗ làm. Nhà ga luôn đông đúc vào lúc tám giờ. Tôi mua vé từ máy và đợi ở sân ga số ba. Tàu thường đúng giờ, nhưng đôi khi bị trễ. Hôm qua tôi đã đợi hai mươi phút vì mưa. Tôi thích đọc sách trong khi đi tàu. Điều đó làm cho hành trình có vẻ ngắn hơn. Khi tôi đến văn phòng, tôi cảm thấy sẵn sàng cho ngày mới.",
    vocabulary: [
      v("station", "/ˈsteɪʃn/", "nhà ga", "n"),
      v("ticket", "/ˈtɪkɪt/", "vé", "n"),
      v("platform", "/ˈplætfɔːrm/", "sân ga", "n"),
      v("journey", "/ˈdʒɜːrni/", "hành trình", "n"),
      v("arrive", "/əˈraɪv/", "đến nơi", "v"),
      v("ready", "/ˈredi/", "sẵn sàng", "adj"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "I buy a ___ from the machine before the journey.", ["ticket", "book", "bag", "map"], "ticket", "Tôi mua vé (ticket) từ máy."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Busy' is closest in meaning to ___.", ["crowded", "empty", "quiet", "clean"], "crowded", "'Busy' (đông đúc) ≈ 'crowded'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["The train usually arrive on time.", "The train usually arrives on time.", "The train usually arriving on time.", "The train usually is arrive on time."], "The train usually arrives on time.", "'The train' số ít → 'arrives'."),
    ],
  },
  "read-a2-12": {
    translation:
      "Vào sáng thứ Bảy, tôi dọn nhà và giặt giũ. Vào buổi chiều, tôi gặp bạn bè ở một quán cà phê ở trung tâm thành phố. Chúng tôi trò chuyện, cười và chia sẻ ảnh từ tuần của mình. Vào Chủ nhật, tôi đến thăm ông bà sống gần sông. Bà tôi nấu một bữa trưa lớn cho cả gia đình. Sau bữa trưa, ông tôi và tôi chơi cờ vua trong vườn. Tôi luôn cảm thấy thư giãn và vui sau một cuối tuần bên gia đình.",
    vocabulary: [
      v("laundry", "/ˈlɔːndri/", "giặt giũ", "n"),
      v("cafe", "/kæˈfeɪ/", "quán cà phê", "n"),
      v("share", "/ʃer/", "chia sẻ", "v"),
      v("chess", "/tʃes/", "cờ vua", "n"),
      v("relaxed", "/rɪˈlækst/", "thư giãn", "adj"),
      v("whole", "/hoʊl/", "toàn bộ", "adj"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "On Sunday, the writer visits ___ who live near the river.", ["grandparents", "friends", "cousins", "neighbors"], "grandparents", "Tôi đến thăm ông bà (grandparents)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Relaxed' is closest in meaning to ___.", ["calm", "stressed", "angry", "busy"], "calm", "'Relaxed' (thư giãn) ≈ 'calm' (bình tĩnh)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["She cook a big lunch every Sunday.", "She cooks a big lunch every Sunday.", "She cooking a big lunch every Sunday.", "She is cook a big lunch every Sunday."], "She cooks a big lunch every Sunday.", "'She' + 'cooks'."),
    ],
  },
  "read-a2-13": {
    translation:
      "Một thư viện mới đã khai trương ở thị trấn của chúng tôi vào tháng trước. Đó là một tòa nhà lớn, hiện đại với ba tầng. Tầng trệt có báo và tạp chí, trong khi các tầng trên có sách để học. Cũng có một phòng yên tĩnh với máy tính và Wi-Fi miễn phí. Nơi yêu thích của tôi là khu thiếu nhi, nơi tôi đọc truyện cho em trai. Thư viện mở cửa mỗi ngày trừ thứ Hai. Tôi đến đó hai lần một tuần vì nó yên tĩnh và thanh bình.",
    vocabulary: [
      v("library", "/ˈlaɪbreri/", "thư viện", "n"),
      v("modern", "/ˈmɑːdərn/", "hiện đại", "adj"),
      v("floor", "/flɔːr/", "tầng", "n"),
      v("magazine", "/ˈmæɡəziːn/", "tạp chí", "n"),
      v("peaceful", "/ˈpiːsfəl/", "thanh bình", "adj"),
      v("service", "/ˈsɜːrvɪs/", "dịch vụ", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The library is open every day ___ Monday.", ["except", "and", "but", "or"], "except", "Mở cửa mỗi ngày trừ (except) thứ Hai."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Quiet' is closest in meaning to ___.", ["silent", "noisy", "busy", "loud"], "silent", "'Quiet' (yên tĩnh) ≈ 'silent' (im lặng)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["There is many books on the shelf.", "There are many books on the shelf.", "There have many books on the shelf.", "There be many books on the shelf."], "There are many books on the shelf.", "'Many books' số nhiều → 'are'."),
    ],
  },
  "read-a2-14": {
    translation:
      "Bữa sáng là bữa ăn quan trọng nhất trong ngày. Một bữa sáng tốt cung cấp năng lượng cho buổi sáng. Tôi thường ăn yến mạch với trái cây và một ly sữa. Đôi khi tôi ăn trứng và bánh mì nướng. Tôi cố gắng tránh ngũ cốc ngọt vì chúng chứa quá nhiều đường. Uống nước vào buổi sáng cũng rất quan trọng. Khi tôi ăn sáng lành mạnh, tôi có thể tập trung tốt hơn khi làm việc và không cảm thấy đói trước bữa trưa.",
    vocabulary: [
      v("breakfast", "/ˈbrekfəst/", "bữa sáng", "n"),
      v("energy", "/ˈenərdʒi/", "năng lượng", "n"),
      v("oatmeal", "/ˈoʊtmɪəl/", "yến mạch", "n"),
      v("avoid", "/əˈvɔɪd/", "tránh", "v"),
      v("sugar", "/ˈʃʊɡər/", "đường", "n"),
      v("concentrate", "/ˈkɑːnsntreɪt/", "tập trung", "v"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "A good breakfast gives you ___ for the morning.", ["energy", "money", "time", "sleep"], "energy", "Bữa sáng tốt cho bạn năng lượng (energy)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Avoid' is closest in meaning to ___.", ["stay away from", "look for", "eat", "buy"], "stay away from", "'Avoid' (tránh) ≈ 'stay away from'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["Breakfast are the most important meal.", "Breakfast is the most important meal.", "Breakfast were the most important meal.", "Breakfast have the most important meal."], "Breakfast is the most important meal.", "'Breakfast' số ít → 'is'."),
    ],
  },
  "read-a2-15": {
    translation:
      "Thứ Bảy tuần trước là sinh nhật của em gái tôi. Chúng tôi đã lên kế hoạch cho một bữa tiệc bất ngờ. Bố mẹ tôi trang trí phòng khách bằng bóng bay và đèn. Tôi nướng một chiếc bánh sô-cô-la và viết tên em lên đó. Khi em đi làm về, tất cả chúng tôi hét lên 'Bất ngờ'. Em vui đến mức bật khóc. Chúng tôi ăn bánh, mở nhạc và nhảy đến nửa đêm. Đó là sinh nhật tuyệt vời nhất mà em từng có, và em cảm ơn mọi người rất nhiều.",
    vocabulary: [
      v("surprise", "/sərˈpraɪz/", "sự bất ngờ", "n"),
      v("decorate", "/ˈdekəreɪt/", "trang trí", "v"),
      v("balloon", "/bəˈluːn/", "bóng bay", "n"),
      v("shout", "/ʃaʊt/", "hét, reo", "v"),
      v("midnight", "/ˈmɪdnaɪt/", "nửa đêm", "n"),
      v("ever", "/ˈevər/", "từng", "adv"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "They organized a ___ party for her.", ["surprise", "boring", "small", "quiet"], "surprise", "Họ tổ chức một bữa tiệc bất ngờ (surprise)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Decorate' is closest in meaning to ___.", ["adorn", "remove", "sell", "wash"], "adorn", "'Decorate' (trang trí) ≈ 'adorn'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["She were so happy that she cried.", "She was so happy that she cried.", "She was so happy that she cry.", "She is so happy that she cried."], "She was so happy that she cried.", "'She' + 'was' (quá khứ)."),
    ],
  },
  "read-a2-16": {
    translation:
      "Mùa yêu thích của tôi là mùa thu. Thời tiết mát mẻ và dễ chịu, không quá nóng cũng không quá lạnh. Cây cối chuyển sang màu đỏ, cam và vàng, trông rất đẹp. Tôi thích đi bộ trong công viên và nghe tiếng lá dưới chân. Mùa thu cũng là mùa của năm học mới và những khởi đầu mới mẻ. Tôi thích uống trà nóng trong khi đọc sách trên ban công. Đối với tôi, mùa thu là khoảng thời gian yên bình và dễ chịu nhất trong năm.",
    vocabulary: [
      v("autumn", "/ˈɔːtəm/", "mùa thu", "n"),
      v("comfortable", "/ˈkʌmftəbl/", "dễ chịu", "adj"),
      v("leaf", "/liːf/", "lá (số nhiều: leaves)", "n"),
      v("season", "/ˈsiːzn/", "mùa", "n"),
      v("balcony", "/ˈbælkəni/", "ban công", "n"),
      v("pleasant", "/ˈpleznt/", "dễ chịu, thú vị", "adj"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "In autumn, the trees turn red, orange, and ___.", ["yellow", "blue", "green", "pink"], "yellow", "Lá chuyển màu đỏ, cam và vàng (yellow)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Comfortable' is closest in meaning to ___.", ["pleasant", "painful", "cold", "hard"], "pleasant", "'Comfortable' (dễ chịu) ≈ 'pleasant'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["The leaves falls under my feet.", "The leaves fall under my feet.", "The leaves falling under my feet.", "The leaves is falling under my feet."], "The leaves fall under my feet.", "'Leaves' số nhiều → 'fall'."),
    ],
  },
  "read-a2-17": {
    translation:
      "Tôi đến bác sĩ hôm qua vì tôi bị ho nặng. Phòng chờ đầy người. Sau ba mươi phút, y tá gọi tên tôi. Bác sĩ kiểm tra nhiệt độ và nghe nhịp tim của tôi. Ông nói tôi bị cảm lạnh thông thường và cho tôi một ít thuốc. Ông bảo tôi nghỉ ngơi ở nhà hai ngày và uống nhiều nước. Tôi làm theo lời khuyên của ông, và hôm nay tôi đã cảm thấy khá hơn hôm qua nhiều.",
    vocabulary: [
      v("cough", "/kɔːf/", "cơn ho", "n"),
      v("waiting room", "/ˈweɪtɪ ruːm/", "phòng chờ", "n"),
      v("nurse", "/nɜːrs/", "y tá", "n"),
      v("temperature", "/ˈtemprətʃər/", "nhiệt độ", "n"),
      v("medicine", "/ˈmedɪsn/", "thuốc", "n"),
      v("advice", "/ədˈvaɪs/", "lời khuyên", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The writer went to the doctor because of a bad ___.", ["cough", "fever", "cold", "headache"], "cough", "Tôi đến bác sĩ vì bị ho (cough)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Advice' is closest in meaning to ___.", ["suggestion", "question", "order", "story"], "suggestion", "'Advice' (lời khuyên) ≈ 'suggestion' (gợi ý)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["He give me some medicine.", "He gave me some medicine.", "He giving me some medicine.", "He is give me some medicine."], "He gave me some medicine.", "Quá khứ của 'give' là 'gave'."),
    ],
  },
  "read-a2-18": {
    translation:
      "Mỗi thứ Bảy, Mai đi chợ với mẹ. Họ mua rau, trái cây và cá tươi. Chợ nhỏ nhưng đông đúc. Mai thích người bán trái cây vì cô ấy luôn mỉm cười. Họ thường dành khoảng một giờ ở đó. Sau khi mua sắm, họ ghé ăn một bát mì. Mai mang những túi nhẹ hơn trong khi mẹ cô mang những túi nặng. Trên đường về, họ nói về tuần của mình.",
    vocabulary: [
      v("market", "/ˈmɑːrkɪt/", "chợ", "n"),
      v("vegetable", "/ˈvedʒtəbl/", "rau", "n"),
      v("seller", "/ˈselər/", "người bán", "n"),
      v("smile", "/smaɪl/", "nụ cười", "n"),
      v("noodle", "/ˈnuːdl/", "mì", "n"),
      v("lighter", "/ˈlaɪtər/", "nhẹ hơn", "adj"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "Mai goes to the ___ with her mother every Saturday.", ["market", "park", "school", "hospital"], "market", "Mai đi chợ (market) với mẹ."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Busy' is closest in meaning to ___.", ["crowded", "empty", "quiet", "calm"], "crowded", "'Busy' (đông đúc) ≈ 'crowded'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["She carry the lighter bags.", "She carries the lighter bags.", "She carrying the lighter bags.", "She is carry the lighter bags."], "She carries the lighter bags.", "'She' + 'carries'."),
    ],
  },
  "read-a2-19": {
    translation:
      "Tháng trước, một gia đình mới chuyển đến ở kế bên. Họ có hai đứa con và một chú chó nhỏ. Người bố là bác sĩ và người mẹ là y tá. Vào ngày đầu tiên, họ mang một ít bánh quy đến để chào hỏi. Em gái tôi chơi với các con của họ trong vườn. Con chó thân thiện nhưng rất ồn ào. Chúng tôi giúp họ tìm siêu thị gần nhất. Giờ chúng tôi thường ăn tối cùng nhau vào Chủ nhật.",
    vocabulary: [
      v("neighbor", "/ˈneɪbər/", "hàng xóm", "n"),
      v("move in", "/muːv ɪn/", "chuyển đến", "phr"),
      v("cookie", "/ˈkʊki/", "bánh quy", "n"),
      v("friendly", "/ˈfrendli/", "thân thiện", "adj"),
      v("noisy", "/ˈnɔɪzi/", "ồn ào", "adj"),
      v("nearest", "/ˈnɪrɪst/", "gần nhất", "adj"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The new family brought some ___ to say hello.", ["cookies", "flowers", "books", "toys"], "cookies", "Họ mang bánh quy (cookies) đến chào."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Friendly' is closest in meaning to ___.", ["kind", "rude", "cold", "angry"], "kind", "'Friendly' (thân thiện) ≈ 'kind' (tốt bụng)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["They has two children.", "They have two children.", "They having two children.", "They is have two children."], "They have two children.", "'They' + 'have'."),
    ],
  },
  "read-a2-20": {
    translation:
      "Lớp chúng tôi đi dã ngoại về vùng nông thôn vào thứ Sáu tuần trước. Chúng tôi rời trường lúc bảy giờ sáng bằng xe buýt. Chuyến đi mất hai tiếng. Đầu tiên, chúng tôi thăm một trang trại và nhìn thấy bò và gà. Sau đó chúng tôi ăn trưa gần một dòng sông. Vào buổi chiều, chúng tôi chơi trò chơi và chụp nhiều ảnh. Thời tiết nắng và ấm áp. Chúng tôi quay về lúc năm giờ và mọi người đều mệt nhưng vui. Cô giáo nói năm sau chúng tôi sẽ đi nữa.",
    vocabulary: [
      v("countryside", "/ˈkʌntrisaɪd/", "nông thôn", "n"),
      v("farm", "/fɑːrm/", "trang trại", "n"),
      v("cow", "/kaʊ/", "con bò", "n"),
      v("river", "/ˈrɪvər/", "dòng sông", "n"),
      v("sunny", "/ˈsʌni/", "nắng", "adj"),
      v("trip", "/trɪp/", "chuyến đi", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "They traveled to the countryside by ___.", ["bus", "train", "plane", "car"], "bus", "Họ đi bằng xe buýt (bus)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Sunny' is closest in meaning to ___.", ["bright", "rainy", "cloudy", "cold"], "bright", "'Sunny' (nắng) ≈ 'bright' (sáng)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["The trip take two hours.", "The trip took two hours.", "The trip taking two hours.", "The trip is take two hours."], "The trip took two hours.", "Quá khứ của 'take' là 'took'."),
    ],
  },
  "read-a2-21": {
    translation:
      "Bà tôi là người nấu ăn giỏi nhất trong gia đình. Vào cuối tuần, tôi giúp bà làm món ăn truyền thống. Bà dạy tôi cách nấu cơm, súp và rau. Bà không bao giờ dùng công thức vì bà nhớ mọi thứ. Nhà bếp luôn thơm lừng. Chủ nhật tuần trước, chúng tôi làm gỏi cuốn cùng nhau. Tôi làm chậm, nhưng bà rất kiên nhẫn. Bà nói nấu ăn là một cách để thể hiện tình yêu thương. Tôi hy vọng một ngày nấu ăn giỏi như bà.",
    vocabulary: [
      v("cook", "/kʊk/", "nấu ăn; người nấu ăn", "v"),
      v("traditional", "/trəˈdɪʃənl/", "truyền thống", "adj"),
      v("recipe", "/ˈresəpi/", "công thức", "n"),
      v("smell", "/smel/", "thơm, có mùi", "v"),
      v("spring roll", "/sprɪŋ roʊl/", "gỏi cuốn", "n"),
      v("patient", "/ˈpeɪʃnt/", "kiên nhẫn", "adj"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "Grandma never uses a ___ because she remembers everything.", ["recipe", "book", "list", "timer"], "recipe", "Bà không dùng công thức (recipe)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Patient' is closest in meaning to ___.", ["calm", "angry", "hasty", "rude"], "calm", "'Patient' (kiên nhẫn) ≈ 'calm' (bình tĩnh)."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["She teach me how to cook.", "She teaches me how to cook.", "She teaching me how to cook.", "She is teach me how to cook."], "She teaches me how to cook.", "'She' + 'teaches'."),
    ],
  },
  "read-a2-22": {
    translation:
      "Hôm nay là thứ Hai và trời mưa to. Tôi quên mang ô, nên tôi bị ướt trên đường đến trường. Các con đường bị ngập và giao thông chậm. Nhiều học sinh đến muộn. Cô giáo cho chúng tôi ở trong lớp giờ ra chơi. Tôi ngồi bên cửa sổ và đọc sách. Sau giờ học, mưa tạnh và mặt trời ló ra. Tôi đi bộ về nhà và nhìn thấy một chiếc cầu vồng tuyệt đẹp. Mẹ tôi pha trà nóng khi tôi về đến nhà.",
    vocabulary: [
      v("heavily", "/ˈhevɪli/", "dữ dội, nặng hạt", "adv"),
      v("umbrella", "/ʌmˈbrelə/", "ô, dù", "n"),
      v("flooded", "/ˈflʌdid/", "ngập", "adj"),
      v("traffic", "/ˈtræfɪk/", "giao thông", "n"),
      v("rainbow", "/ˈreɪnboʊ/", "cầu vồng", "n"),
      v("wet", "/wet/", "ướt", "adj"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The writer forgot an ___, so he got wet.", ["umbrella", "book", "bag", "coat"], "umbrella", "Tôi quên ô (umbrella) nên bị ướt."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Heavily' (about rain) is closest in meaning to ___.", ["hard", "lightly", "slowly", "softly"], "hard", "Mưa 'heavily' (to) ≈ 'hard'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["The streets is flooded.", "The streets are flooded.", "The streets be flooded.", "The streets have flooded."], "The streets are flooded.", "'Streets' số nhiều → 'are'."),
    ],
  },
  "read-a2-23": {
    translation:
      "Môn thể thao yêu thích của tôi là bơi lội. Tôi đến hồ bơi hai lần một tuần với anh trai. Chúng tôi thường bơi trong một tiếng. Bơi lội làm tôi khỏe mạnh. Vào mùa hè, chúng tôi cũng đi biển. Tháng trước, tôi tham gia một câu lạc bộ bơi. Huấn luyện viên rất tốt và dạy chúng tôi những kiểu bơi mới. Tôi không phải người nhanh nhất, nhưng tôi đang tiến bộ. Mục tiêu của tôi là bơi một kilômét mà không dừng lại.",
    vocabulary: [
      v("swimming", "/ˈswɪmɪŋ/", "bơi lội", "n"),
      v("pool", "/puːl/", "hồ bơi", "n"),
      v("healthy", "/ˈhelθi/", "khỏe mạnh", "adj"),
      v("coach", "/koʊtʃ/", "huấn luyện viên", "n"),
      v("improve", "/ɪmˈpruːv/", "tiến bộ, cải thiện", "v"),
      v("goal", "/ɡoʊl/", "mục tiêu", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The writer goes to the ___ twice a week.", ["pool", "gym", "park", "beach"], "pool", "Tôi đến hồ bơi (pool) hai lần một tuần."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Improve' is closest in meaning to ___.", ["get better", "get worse", "stop", "fail"], "get better", "'Improve' (cải thiện) ≈ 'get better'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["Swimming make me strong.", "Swimming makes me strong.", "Swimming making me strong.", "Swimming are make me strong."], "Swimming makes me strong.", "Động từ 'swimming' (V-ing) số ít → 'makes'."),
    ],
  },
  "read-a2-24": {
    translation:
      "Hôm qua, ông Nam làm mất ví trên xe buýt. Bên trong có tiền và những chiếc thẻ quan trọng. Ông rất lo lắng. Một học sinh tìm thấy chiếc ví và đưa cho tài xế xe buýt. Tài xế gọi số điện thoại trên thẻ ID. Ông Nam đến bến xe để lấy lại. Ông vui đến mức muốn tặng thưởng. Cậu học sinh nói không cần và chỉ dặn ông cẩn thận hơn lần sau.",
    vocabulary: [
      v("wallet", "/ˈwɑːlɪt/", "ví", "n"),
      v("worry", "/ˈwɜːri/", "lo lắng", "v"),
      v("driver", "/ˈdraɪvər/", "tài xế", "n"),
      v("reward", "/rɪˈwɔːrd/", "phần thưởng", "n"),
      v("careful", "/ˈkerfəl/", "cẩn thận", "adj"),
      v("inside", "/ˌɪnˈsaɪd/", "bên trong", "adv"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "Mr. Nam lost his ___ on the bus.", ["wallet", "phone", "bag", "keys"], "wallet", "Ông Nam làm mất ví (wallet)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Worried' is closest in meaning to ___.", ["anxious", "calm", "happy", "proud"], "anxious", "'Worried' (lo lắng) ≈ 'anxious'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["He were very worried.", "He was very worried.", "He is very worried yesterday.", "He have worried."], "He was very worried.", "'He' + 'was' (quá khứ)."),
    ],
  },
  "read-a2-25": {
    translation:
      "Lan thân mến, Mình viết từ Đà Nẵng, nơi mình đang đi nghỉ cùng gia đình. Bãi biển ở đây rất đẹp và hải sản rất ngon. Hôm qua chúng mình đã thăm Ngũ Hành Sơn và chụp nhiều ảnh. Thời tiết nóng, nên chúng mình tắm biển mỗi buổi chiều. Vào buổi tối, chúng mình đi dạo dọc bãi biển và ăn kem. Mình ước gì cậu ở đây với chúng mình. Mình sẽ mang cho cậu một món quà nhỏ. Hẹn gặp tuần sau! Bạn của cậu, Hoa.",
    vocabulary: [
      v("holiday", "/ˈhɑːlədeɪ/", "kỳ nghỉ", "n"),
      v("delicious", "/dɪˈlɪʃəs/", "ngon", "adj"),
      v("visit", "/ˈvɪzɪt/", "thăm", "v"),
      v("mountain", "/ˈmaʊntn/", "ngọn núi", "n"),
      v("gift", "/ɡɪft/", "món quà", "n"),
      v("wish", "/wɪʃ/", "ước", "v"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "Hoa is writing from ___ where she is on holiday.", ["Da Nang", "Hanoi", "Hue", "Sa Pa"], "Da Nang", "Hoa viết từ Đà Nẵng (Da Nang)."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Delicious' is closest in meaning to ___.", ["tasty", "awful", "salty", "dry"], "tasty", "'Delicious' (ngon) ≈ 'tasty'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["We was visiting the mountains.", "We visited the mountains yesterday.", "We visit the mountains yesterday.", "We were visit the mountains."], "We visited the mountains yesterday.", "Quá khứ đơn của 'visit' là 'visited'."),
    ],
  },
  "read-a2-26": {
    translation:
      "Thị trấn chúng tôi khai trương một thư viện mới vào tuần trước. Đó là một tòa nhà lớn, hiện đại với ba tầng. Tầng trệt có báo và tạp chí. Tầng một có sách thiếu nhi và khu vui chơi. Tầng hai yên tĩnh để học. Cũng có máy tính với internet miễn phí. Nơi yêu thích của tôi là quán cà phê nhỏ trên tầng trên cùng. Tôi đến đó mỗi thứ Bảy để đọc sách và thư giãn. Thư viện mở cửa từ tám giờ sáng đến tám giờ tối.",
    vocabulary: [
      v("modern", "/ˈmɑːdərn/", "hiện đại", "adj"),
      v("newspaper", "/ˈnuːzpeɪpər/", "báo", "n"),
      v("magazine", "/ˈmæɡəziːn/", "tạp chí", "n"),
      v("internet", "/ˈɪntərnet/", "internet", "n"),
      v("relax", "/rɪˈlæks/", "thư giãn", "v"),
      v("floor", "/flɔːr/", "tầng", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The library has ___ floors.", ["three", "two", "four", "five"], "three", "Thư viện có ba (three) tầng."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Quiet' is closest in meaning to ___.", ["silent", "noisy", "busy", "loud"], "silent", "'Quiet' (yên tĩnh) ≈ 'silent'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["The library open at eight.", "The library opens at eight.", "The library opening at eight.", "The library is open at eight yesterday."], "The library opens at eight.", "'The library' số ít → 'opens'."),
    ],
  },
  "read-a2-27": {
    translation:
      "Tôi có một chú chó cưng tên là Rex. Nó ba tuổi và rất thân thiện. Mỗi sáng, tôi đưa nó đi dạo trong công viên. Nó thích chạy và chơi với quả bóng. Rex sợ sấm, nên nó trốn dưới gầm giường. Nó ăn hai bữa một ngày và ngủ rất nhiều. Gia đình tôi rất yêu nó. Nó không chỉ là một con thú cưng; nó là một phần của gia đình chúng tôi.",
    vocabulary: [
      v("pet", "/pet/", "thú cưng", "n"),
      v("friendly", "/ˈfrendli/", "thân thiện", "adj"),
      v("thunder", "/ˈθʌndər/", "sấm", "n"),
      v("hide", "/haɪd/", "trốn", "v"),
      v("meal", "/miːl/", "bữa ăn", "n"),
      v("part", "/pɑːrt/", "phần", "n"),
    ],
    exercises: [
      ex(1, "fill_blank", "Chọn từ đúng để điền vào chỗ trống.", "The writer's pet dog is named ___.", ["Rex", "Max", "Bob", "Tom"], "Rex", "Chó tên là Rex."),
      ex(2, "synonym", "Chọn từ gần nghĩa nhất.", "'Friendly' is closest in meaning to ___.", ["kind", "fierce", "lazy", "shy"], "kind", "'Friendly' (thân thiện) ≈ 'kind'."),
      ex(3, "error_correction", "Chọn câu đúng ngữ pháp.", "Which sentence is correct?", ["He have three years old.", "He is three years old.", "He has three years old.", "He were three years old."], "He is three years old.", "Tuổi: 'He is ... years old'."),
    ],
  },
};

let updated = 0;
for (const p of passages) {
  const c = CONTENT[p.id];
  if (!c) continue;
  p.translation = c.translation;
  p.vocabulary = c.vocabulary;
  p.exercises = c.exercises;
  updated++;
}

// validate answers match an option
let bad = 0;
for (const p of passages) {
  for (const e of p.exercises || []) {
    if (e.options && !e.options.includes(e.answer)) {
      console.log(`ANSWER MISMATCH ${p.id} ex${e.id}: "${e.answer}" not in options`);
      bad++;
    }
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(passages, null, 2) + "\n");

console.log(`A2 passages updated: ${updated}`);
console.log(`Answer/option mismatches: ${bad}`);
console.log(`A2 with translation: ${passages.filter((p) => p.level === "A2" && p.translation).length}`);
console.log(`A2 with vocabulary: ${passages.filter((p) => p.level === "A2" && p.vocabulary && p.vocabulary.length).length}`);
console.log(`A2 with exercises: ${passages.filter((p) => p.level === "A2" && p.exercises && p.exercises.length).length}`);