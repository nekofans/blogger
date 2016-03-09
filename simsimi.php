<?php
  /** dwisiswanto.my.id **/
  /***********************/
 
$aing = array(
    "tkn"=>"202819838:AAEkA6MHWiPwZlbTC1ju-Hqp8r2rlTto97I", // isi dengan token dari akun bot Anda
    "log"=>"piro.txt",
    "udh"=>"simpen.txt"
);
 
# untuk mengirim pesan dengan metode cURL
function hajar($yuerel, $dataAing = null) {
    $cuih = curl_init();
    curl_setopt($cuih, CURLOPT_URL, $yuerel);
    if ($dataAing != null){
        curl_setopt($cuih, CURLOPT_POST, true);
        curl_setopt($cuih, CURLOPT_POSTFIELDS, $dataAing);
    }
    curl_setopt($cuih, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($cuih, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($cuih, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($cuih, CURLOPT_COOKIEFILE, 'cookie.txt');
    curl_setopt($cuih, CURLOPT_COOKIEJAR, 'bot.txt');
    curl_setopt($cuih, CURLOPT_COOKIESESSION, true);
    $eks = curl_exec($cuih);
    curl_close($cuih);
    return $eks;
}
 
# untuk menyimpan yang sudah dikirimkan pesan
function simpen($dmn, $apa) {
    fwrite(fopen($dmn, "a+"), $apa . PHP_EOL);
    fclose(fopen($dmn, "a+"));
}
 
$upd = json_decode(hajar("https://api.telegram.org/bot" . $aing['tkn'] . "/getUpdates"), true); // mengambil pesan dari akun bot
$buka = fopen($aing['log'], "r");
$scan = fscanf($buka, "%d");
 
# jika mengambil pesan dari bot bernilai true
if ($upd['ok'] == 1) {
    for ($brp = $scan[0]; $brp<=count($upd['result']); $brp++) {
        $psn = $upd['result'][$brp - 1]['message'];
        $simi = json_decode(hajar("http://www.simsimi.com/requestChat?lc=id&ft=1.0&req=" . urlencode($psn['text'])), true); // mengirimkan pesan dari akun bot ke server SimSimi
 
        if (ereg($psn['date'], file_get_contents($aing['udh']))) { # jika pesan sudah dibalas
           echo "[" . $brp . "/" . count($upd['result']) . "] Udah pernah di kirim.\n";
        } elseif (preg_match("/I HAVE NO RESPONSE./i", $simi['res'])) { # jika server SimSimi tidak mendapatkan balasan untuk pesan dari akun bot, maka akan mengirim pesan secara acak bahwa akun bot tidak mengerti
           echo "[" . $brp . "/" . count($upd['result']) . "] Uh, oh! Tidak ada respon untuk pesan \"" . $psn['text'] . "\". Mencoba mengirim pesan sibuk: ";
            $sibuk = array("Ngomong apaan sih?", "Maksudnya?", "Apaan itu?", "Aku gak ngerti maksudnya kak.", "Sakkarepmu!", "Mbuh!", "Kalo ngomong yang jelas dong.", "Lu lagi ngomong?", "Ogah banget ngeladenin chat lu.");
            $krm = json_decode(hajar("https://api.telegram.org/bot" . $aing['tkn'] . "/sendMessage", array(
                "chat_id"=>$psn['chat']['id'],
                "text"=>$sibuk[array_rand($sibuk)],
                "reply_to_message_id"=>$psn['message_id'])
            ), true);
            if ($krm['ok'] == 1) {
                echo "DONE.\n";
                simpen($aing['udh'], $psn['date']);
            } else {
                echo "FAIL!\n";
            }
        } else {
            # ini kondisi dimana server SimSimi menerima pesan bot dengan baik
           $krm = json_decode(hajar("https://api.telegram.org/bot" . $aing['tkn'] . "/sendMessage", array(
                "chat_id"=>$psn['chat']['id'],
                "text"=>$simi['res'],
                "reply_to_message_id"=>$psn['message_id'])), true);
            if ($krm['ok'] == 1) {
                echo "[" . $brp . "/" . count($upd['result']) . "] Berhasil mengirim ke " . $psn['from']['first_name'] . " " . $psn['from']['last_name'] . " (" . $psn['from']['id'] . ")\n";
                simpen($aing['udh'], $psn['date']);
            } else {
                echo "[" . $brp . "/" . count($upd['result']) . "] " . $krm['description'] . "\n";
            }
        }
    }
    file_put_contents($aing['log'], count($upd['result'])); // me-replace daftar log untuk limit
} else {
    # jika gagal mengambil pesan dari bot
   echo $upd['description'];
    exit;
}
