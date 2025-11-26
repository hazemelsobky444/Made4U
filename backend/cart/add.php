    <?php
    // backend/cart/add.php
    session_start();
    require_once __DIR__ . '/../db.php';
    header('Content-Type: application/json; charset=utf-8');

    if (!isset($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error'=>'unauthorized']); exit; }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'method_not_allowed']); exit; }

    $user_id = intval($_SESSION['user_id']);
    $product_id = intval($_POST['product_id'] ?? 0);
    $qty = max(1, intval($_POST['quantity'] ?? 1));

    if (!$product_id) { http_response_code(400); echo json_encode(['error'=>'invalid_product']); exit; }

    // check existing
    $stmt = $conn->prepare("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?");
    $stmt->bind_param("ii", $user_id, $product_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        $newQty = $row['quantity'] + $qty;
        $stmt2 = $conn->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
        $stmt2->bind_param("ii", $newQty, $row['id']);
        $stmt2->execute();
        $stmt2->close();
    } else {
        $stmt2 = $conn->prepare("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)");
        $stmt2->bind_param("iii", $user_id, $product_id, $qty);
        $stmt2->execute();
        $stmt2->close();
    }
    $stmt->close();

    echo json_encode(['status'=>'success']);
    ?>
